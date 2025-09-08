/* eslint-env node */
import { common, llm, memory, vector } from "@copilot-ld/libtype";
import { generateSessionId, getLatestUserMessage } from "@copilot-ld/libutil";

import { AgentBase } from "../../generated/services/agent/service.js";

/**
 * Converts a memory window to a simple messages array for LLM completion
 * @param {import("@copilot-ld/libtype").common.Assistant} assistant - The assistant
 * @param {import("@copilot-ld/libtype").task.Task[]} tasks - Array of tasks
 * @param {import("@copilot-ld/libtype").memory.Window} window - Memory window from memory service
 * @param {import("@copilot-ld/libresource").ResourceIndexInterface} resourceIndex - Resource index for retrieving actual messages
 * @returns {Promise<import("@copilot-ld/libtype").common.MessageV2[]>} Array of MessageV2 objects for LLM
 */
async function toMessages(assistant, tasks, window, resourceIndex) {
  const messages = [];
  const actor = "cld:common.System.root";

  // Add assistant
  messages.push(assistant);

  // Add tasks if available
  if (tasks && tasks.length > 0) {
    messages.push(...tasks);
  }

  // Add tools if available
  if (window?.tools?.length > 0) {
    const tools = await resourceIndex.get(actor, window.tools);
    messages.push(...tools);
  }

  // Add context if available
  if (window?.context?.length > 0) {
    const context = await resourceIndex.get(actor, window.context);
    messages.push(...context);
  }

  // Add conversation history in chronological order
  if (window?.history?.length > 0) {
    const history = await resourceIndex.get(actor, window.history);
    messages.push(...history);
  }

  return messages;
}

/**
 * Converts an array of ToolFunction resources to common.Tool objects for LLM
 * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Array of ToolFunction resources
 * @param {import("@copilot-ld/libresource").ResourceIndexInterface} resourceIndex - Resource index for retrieving actual tool resources
 * @returns {object[]} Array of Tool objects for LLM
 */
async function toTools(identifiers, resourceIndex) {
  if (!identifiers || identifiers.length === 0) return [];
  const actor = "cld:common.System.root";
  const functions = await resourceIndex.get(actor, identifiers);

  return functions.map((func) => {
    return common.Tool.fromObject({
      type: "function",
      function: func,
    });
  });
}

/**
 * Main orchestration service for agent requests
 * @deprecated This service will be replaced by Assistant, Task, Conversation, and Context services in the new architecture
 */
class AgentService extends AgentBase {
  #memoryClient;
  #llmClient;
  #vectorClient;
  #toolClient;
  #resourceIndex;
  #octokitFactory;

  /**
   * Creates a new Agent service instance
   * @param {object} config - Service configuration object
   * @param {import("../memory/client.js").MemoryClient} memoryClient - Memory service client
   * @param {import("../llm/client.js").LlmClient} llmClient - LLM service client
   * @param {import("../vector/client.js").VectorClient} vectorClient - Vector service client
   * @param {import("../tool/client.js").ToolClient} toolClient - Tool service client
   * @param {import("@copilot-ld/libresource").ResourceIndexInterface} resourceIndex - ResourceIndex instance for data access
   * @param {(token: string) => object} octokitFactory - Factory function to create Octokit instances
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory function
   */
  constructor(
    config,
    memoryClient,
    llmClient,
    vectorClient,
    toolClient,
    resourceIndex,
    octokitFactory,
    logFn,
  ) {
    super(config, logFn);
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!llmClient) throw new Error("llmClient is required");
    if (!vectorClient) throw new Error("vectorClient is required");
    if (!toolClient) throw new Error("toolClient is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!octokitFactory) throw new Error("octokitFactory is required");

    this.#memoryClient = memoryClient;
    this.#llmClient = llmClient;
    this.#vectorClient = vectorClient;
    this.#toolClient = toolClient;
    this.#resourceIndex = resourceIndex;
    this.#octokitFactory = octokitFactory;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").agent.AgentResponse>} Response message
   */
  async ProcessRequest(req) {
    this.debug("Processing request", {
      conversation: req.conversation_id,
      messages: req.messages?.length || 0,
    });

    // Ensure all clients are ready before processing
    await Promise.all([
      this.#memoryClient.ensureReady(),
      this.#llmClient.ensureReady(),
      this.#vectorClient.ensureReady(),
      this.#toolClient.ensureReady(),
    ]);

    const octokit = this.#octokitFactory(req.github_token);
    await octokit.request("GET /user");

    const actor = "cld:common.System.root";
    let conversation;
    let completions = {};

    // Step 1: Initiate the conversation
    if (req.conversation_id) {
      [conversation] = await this.#resourceIndex.get(actor, [
        req.conversation_id,
      ]);
    } else {
      conversation = common.Conversation.fromObject({
        id: {
          name: generateSessionId(),
        },
      });
      this.#resourceIndex.put(conversation);
    }

    const message = getLatestUserMessage(req.messages);

    if (!message) {
      throw new Error("No user message found in request");
    }
    message.withIdentifier(conversation.id);
    this.#resourceIndex.put(message);

    if (message?.content) {
      // Step 2: Load assistant and tasks, subtract from token budget
      const [assistant] = await this.#resourceIndex.get(actor, [
        this.config.assistant,
      ]);

      if (!assistant) {
        throw new Error(
          `Assistant not found: ${this.config.assistant?.name || "unknown"}`,
        );
      }

      // TODO: Load task tree
      let tasks = [];

      let budget = this.config.budget?.tokens;
      const allocation = this.config.budget?.allocation;
      budget = Math.max(0, budget - assistant.content.tokens);

      this.debug("Adjusted budget", {
        before: this.config.budget.tokens,
        after: budget,
      });

      // Step 3: Search for similarities and append them to memory
      this.debug("About to create embeddings", {
        messageContent: message.content,
      });

      const embeddings = await this.#llmClient.CreateEmbeddings(
        new llm.EmbeddingsRequest({
          chunks: [message.content],
          github_token: req.github_token,
        }),
      );

      const vector_data = embeddings.data[0].embedding;

      this.debug("About to query items", {
        vectorNamespace: typeof vector,
        QueryItemsRequestType: typeof vector.QueryItemsRequest,
      });

      const { identifiers } = await this.#vectorClient.QueryItems(
        new vector.QueryItemsRequest({
          index: "content",
          vector: vector_data,
          filters: {
            threshold: this.config.threshold?.toString(),
            limit: this.config.limit?.toString(),
          },
        }),
      );

      this.debug("Similar resources", { identifiers: identifiers.length });

      this.#memoryClient.Append(
        new memory.AppendRequest({
          for: conversation.id,
          identifiers,
        }),
      );

      // Step 4: Get the memory window
      const window = await this.#memoryClient.GetWindow(
        new memory.WindowRequest({
          for: conversation.id,
          vector: vector_data,
          budget,
          allocation: allocation
            ? new memory.WindowRequest.Allocation({
                tools: Math.round(budget * allocation.tools),
                history: Math.round(budget * allocation.history),
                context: Math.round(budget * allocation.context),
              })
            : undefined,
        }),
      );

      // Step 5: Get LLM completion with tool calling support - Inner Loop
      let messages = await toMessages(
        assistant,
        tasks,
        window,
        this.#resourceIndex,
      );

      let tools = [];
      if (window?.tools.length > 0) {
        tools = await toTools(window.tools, this.#resourceIndex);
      }

      // Inner loop to handle tool calls until completion
      let maxIterations = 10;
      let currentIteration = 0;

      while (currentIteration < maxIterations) {
        this.debug("Inner loop", {
          iteration: currentIteration + 1,
          maxIterations,
        });

        // Build request object using fromObject for proper initialization
        const completionRequest = llm.CompletionsRequest.fromObject({
          messages,
          tools,
          temperature: this.config.temperature,
          github_token: req.github_token,
        });

        completions =
          await this.#llmClient.CreateCompletions(completionRequest);

        if (!completions?.choices?.length) {
          this.debug("No completions, ending inner loop");
          break;
        }

        // Find the first choice with tool calls
        let choiceWithToolCalls = null;
        for (const choice of completions.choices) {
          if (choice.message?.tool_calls?.length > 0) {
            choiceWithToolCalls = choice;
            break;
          }
        }

        // If no tool calls found in any choice, we're done
        if (!choiceWithToolCalls) {
          this.debug("No tool calls, ending inner loop");
          break;
        }

        this.debug("Processing tool", {
          calls: choiceWithToolCalls.message.tool_calls.length,
          iteration: currentIteration + 1,
          index: completions.choices.indexOf(choiceWithToolCalls),
        });

        // Add the assistant's message with tool calls to conversation
        messages.push(choiceWithToolCalls.message);

        // Execute each tool call and collect results
        const toolResults = [];
        for (const toolCall of choiceWithToolCalls.message.tool_calls) {
          try {
            const toolResult = await this.#toolClient.ExecuteTool(toolCall);

            this.debug("Tool execution successful", {
              callId: toolCall.id,
              functionId: toolCall.function?.id,
            });

            messages.push(toolResult);
          } catch (error) {
            this.debug("Tool execution failed", {
              callId: toolCall.id,
              functionId: toolCall.function?.id,
              error: error.message,
            });

            // Add error as tool result
            toolResults.push(
              common.MessageV2.fromObject({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  error: {
                    type: "tool_execution_error",
                    message: error.message || "",
                    code: error.code || "unknown",
                  },
                }),
              }),
            );
          }
        }
        currentIteration++;
      }

      // Step 7: Save the response
      if (completions?.choices?.length > 0) {
        this.debug("Completion received", {
          choices: completions.choices.length,
        });
        completions.choices[0].message.withIdentifier(conversation.id);
        this.#resourceIndex.put(completions.choices[0].message);
      }
    }

    this.debug("Request complete", {
      conversation: conversation.id,
      choices: completions?.choices?.length || 0,
      tokens: completions?.usage?.total_tokens || "unknown",
    });

    return {
      ...completions,
      conversation_id: conversation.id,
    };
  }
}

/**
 * @deprecated This service will be replaced by Assistant, Task, Conversation, and Context services in the new architecture
 */
export { AgentService };
export { AgentClient } from "../../generated/services/agent/client.js";
