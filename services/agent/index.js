/* eslint-env node */
import { common, llm, memory, vector } from "@copilot-ld/libtype";
import {
  getLatestUserMessage,
  generateUUID,
  toMessages,
  toTools,
} from "@copilot-ld/libutil";
import { services } from "@copilot-ld/librpc";

const { AgentBase } = services;

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
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {object} memoryClient - Memory service client
   * @param {object} llmClient - LLM service client
   * @param {object} vectorClient - Vector service client
   * @param {object} toolClient - Tool service client
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance for data access
   * @param {(token: string) => import("@octokit/rest").Octokit} octokitFactory - Factory function to create Octokit instances
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
   * Sets up conversation and loads assistant configuration
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<{conversation: import("@copilot-ld/libtype").common.Conversation, message: import("@copilot-ld/libtype").common.Message, assistant: import("@copilot-ld/libtype").common.Assistant, tasks: object[], budget: number}>} Setup results
   * @private
   */
  async #setupConversation(req) {
    const actor = "common.System.root";
    let conversation;

    // Step 1: Initiate the conversation
    if (req.conversation_id) {
      [conversation] = await this.#resourceIndex.get(actor, [
        req.conversation_id,
      ]);
    } else {
      conversation = common.Conversation.fromObject({
        id: {
          name: generateUUID(),
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

    // Step 2: Load assistant and tasks, subtract from token budget
    const [assistant] = await this.#resourceIndex.get(actor, [
      this.config.assistant,
    ]);

    if (!assistant) {
      throw new Error(`Assistant not found: ${this.config.assistant}`);
    }

    // TODO: Load task tree
    let tasks = [];

    let budget = this.config.budget?.tokens;
    budget = Math.max(0, budget - assistant.content.tokens);

    this.debug("Adjusted budget", {
      before: this.config.budget.tokens,
      after: budget,
    });

    return { conversation, message, assistant, tasks, budget };
  }

  /**
   * Handles vector search and memory window creation
   * @param {import("@copilot-ld/libtype").common.Conversation} conversation - Conversation object
   * @param {import("@copilot-ld/libtype").common.Message} message - User message
   * @param {import("@copilot-ld/libtype").common.Assistant} assistant - Assistant configuration
   * @param {object[]} tasks - Tasks array
   * @param {number} budget - Token budget
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<{messages: import("@copilot-ld/libtype").common.Message[], tools: import("@copilot-ld/libtype").common.Tool[]}>} Memory results
   * @private
   */
  async #getMemory(conversation, message, assistant, tasks, budget, req) {
    // Step 3: Search for similarities and append them to memory
    const embeddings = await this.#llmClient.CreateEmbeddings(
      new llm.EmbeddingsRequest({
        chunks: [message.content.toString()],
        github_token: req.github_token,
      }),
    );

    const vector_data = embeddings.data[0].embedding;

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
        for: conversation.id.toString(),
        identifiers,
      }),
    );

    // Step 4: Get the memory window
    const allocation = this.config.budget?.allocation;
    const window = await this.#memoryClient.GetWindow(
      new memory.WindowRequest({
        for: conversation.id.toString(),
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

    // Convert window to messages and tools
    const messages = await toMessages(
      assistant,
      tasks,
      window,
      this.#resourceIndex,
    );

    let tools = [];
    if (window?.tools.length > 0) {
      tools = await toTools(window.tools, this.#resourceIndex);
    }

    return { messages, tools };
  }

  /**
   * Executes a single tool call and returns the result
   * @param {import("@copilot-ld/libtype").common.Tool} toolCall - Tool call object
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").common.Message>} Tool result message
   * @private
   */
  async #executeToolCall(toolCall, req) {
    try {
      // Pass-on github_token for tools that may need it
      toolCall.github_token = req.github_token;
      const toolResult = await this.#toolClient.ExecuteTool(toolCall);

      this.debug("Tool execution successful", {
        callId: toolCall.id,
        functionId: toolCall.function?.id,
      });

      return toolResult;
    } catch (error) {
      this.debug("Tool execution failed", {
        callId: toolCall.id,
        functionId: toolCall.function?.id,
        error: error.message,
      });

      // Return error as tool result
      return common.Message.fromObject({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: {
            type: "tool_execution_error",
            message: error.message || "",
            code: error.code || "unknown",
          },
        }),
      });
    }
  }

  /**
   * Processes tool calls for a completion choice
   * @param {import("@copilot-ld/libtype").common.Choice} choiceWithToolCalls - Completion choice with tool calls
   * @param {import("@copilot-ld/libtype").common.Message[]} messages - Array of messages
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<void>}
   * @private
   */
  async #processToolCalls(choiceWithToolCalls, messages, req) {
    this.debug("Processing tool", {
      calls: choiceWithToolCalls.message.tool_calls.length,
    });

    // Add the assistant's message with tool calls to conversation
    messages.push(choiceWithToolCalls.message);

    // Execute each tool call and collect results
    for (const toolCall of choiceWithToolCalls.message.tool_calls) {
      const toolResult = await this.#executeToolCall(toolCall, req);
      messages.push(toolResult);
    }
  }

  /**
   * Handles the tool execution loop with LLM completions
   * @param {import("@copilot-ld/libtype").common.Message[]} messages - Array of messages for LLM
   * @param {import("@copilot-ld/libtype").common.Tool[]} tools - Array of available tools
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").llm.CompletionsResponse>} LLM completions response
   * @private
   */
  async #executeToolLoop(messages, tools, req) {
    let completions = {};
    let maxIterations = 10;
    let currentIteration = 0;

    // Step 6: Inner loop with tool calls
    while (currentIteration < maxIterations) {
      // Build request object using fromObject for proper initialization
      const completionRequest = llm.CompletionsRequest.fromObject({
        messages,
        tools,
        temperature: this.config.temperature,
        github_token: req.github_token,
      });

      completions = await this.#llmClient.CreateCompletions(completionRequest);

      if (!completions?.choices?.length) {
        this.debug("No completions, ending inner loop");
        break;
      }

      // Find the first choice with tool calls
      const choiceWithToolCalls = completions.choices.find(
        (choice) => choice.message?.tool_calls?.length > 0,
      );

      // If no tool calls found in any choice, we're done
      if (!choiceWithToolCalls) {
        this.debug("No tool calls, ending inner loop");
        break;
      }

      await this.#processToolCalls(choiceWithToolCalls, messages, req);
      currentIteration++;
    }

    return completions;
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

    const octokit = this.#octokitFactory(req.github_token);
    await octokit.request("GET /user");

    const { conversation, message, assistant, tasks, budget } =
      await this.#setupConversation(req);

    if (message?.content) {
      const { messages, tools } = await this.#getMemory(
        conversation,
        message,
        assistant,
        tasks,
        budget,
        req,
      );
      const completions = await this.#executeToolLoop(messages, tools, req);

      // Step 7: Save the response
      if (completions?.choices?.length > 0) {
        this.debug("Completion received", {
          choices: completions.choices.length,
        });
        completions.choices[0].message.withIdentifier(conversation.id);
        this.#resourceIndex.put(completions.choices[0].message);
      }

      return {
        ...completions,
        conversation_id: conversation.id.toString(),
      };
    }

    return { conversation_id: conversation.id.toString() };
  }
}

/**
 * @deprecated This service will be replaced by Assistant, Task, Conversation, and Context services in the new architecture
 * @see TODO.md
 */
export { AgentService };
