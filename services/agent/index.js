/* eslint-env node */
import { common, llm, memory, tool } from "@copilot-ld/libtype";
import { getLatestUserMessage, generateUUID } from "@copilot-ld/libutil";
import { services } from "@copilot-ld/librpc";

const { AgentBase } = services;

/**
 * Converts a memory window to a simple messages array for LLM completion
 * @param {import("@copilot-ld/libtype").common.Assistant} assistant - The assistant
 * @param {import("@copilot-ld/libtype").task.Task[]} tasks - Array of tasks
 * @param {import("@copilot-ld/libtype").memory.Window} window - Memory window from memory service
 * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for retrieving actual messages
 * @returns {Promise<import("@copilot-ld/libtype").common.Message[]>} Array of Message objects for LLM
 */
export async function toMessages(assistant, tasks, window, resourceIndex) {
  if (!assistant) throw new Error("assistant is required");
  if (!resourceIndex) throw new Error("resourceIndex is required");

  const messages = [];
  const actor = "common.System.root";

  // Add assistant
  messages.push(assistant);

  // Add tasks if available
  if (tasks && tasks.length > 0) {
    messages.push(...tasks);
  }

  // Add tools if available
  const tools = await resourceIndex.get(actor, window?.tools);
  messages.push(...tools);

  // Add context if available
  const context = await resourceIndex.get(actor, window?.context);
  messages.push(...context);

  // Add conversation history in chronological order
  const history = await resourceIndex.get(actor, window?.history);
  messages.push(...history);

  return messages;
}

/**
 * Converts an array of tool.ToolFunction resources to tool.ToolDefinition objects for LLM
 * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Array of ToolFunction resources
 * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for retrieving actual tool resources
 * @returns {Promise<import("@copilot-ld/libtype").tool.ToolDefinition[]>} Array of Tool objects for LLM
 */
export async function toTools(identifiers, resourceIndex) {
  if (!resourceIndex) throw new Error("resourceIndex is required");

  const actor = "common.System.root";
  const functions = await resourceIndex.get(actor, identifiers);

  return functions.map((func) => {
    return tool.ToolDefinition.fromObject({
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
  #toolClient;
  #resourceIndex;
  #octokitFactory;

  /**
   * Creates a new Agent service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {object} memoryClient - Memory service client
   * @param {object} llmClient - LLM service client
   * @param {object} toolClient - Tool service client
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance for data access
   * @param {(token: string) => import("@octokit/rest").Octokit} octokitFactory - Factory function to create Octokit instances
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory function
   */
  constructor(
    config,
    memoryClient,
    llmClient,
    toolClient,
    resourceIndex,
    octokitFactory,
    logFn,
  ) {
    super(config, logFn);
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!llmClient) throw new Error("llmClient is required");
    if (!toolClient) throw new Error("toolClient is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!octokitFactory) throw new Error("octokitFactory is required");

    this.#memoryClient = memoryClient;
    this.#llmClient = llmClient;
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
      `common.Assistant.${this.config.assistant}`,
    ]);

    if (!assistant) {
      throw new Error(`Assistant not found: ${this.config.assistant}`);
    }

    // Load permanent tools from config
    const permanentToolNames = this.config.permanent_tools || [];
    const functionIds = permanentToolNames.map(
      (name) => `tool.ToolFunction.${name}`,
    );
    const functions = await this.#resourceIndex.get(
      "common.System.root",
      functionIds,
    );

    const permanentTools = functions.map((func) => {
      return tool.ToolDefinition.fromObject({
        type: "function",
        function: func,
      });
    });

    // TODO: Load task tree
    let tasks = [];

    return { conversation, message, assistant, tasks, permanentTools };
  }

  /**
   * Calculates the adjusted token budget based on the resources used
   * @param {import("@copilot-ld/libtype").common.Assistant} assistant - Assistant resource
   * @param {import("@copilot-ld/libtype").tool.ToolDefinition[]} permanentTools - Permanent tools
   * @param {import("@copilot-ld/libtype").common.Task[]} tasks - Task resources
   * @returns {number} Adjusted token budget
   * @private
   */
  #getBudget(assistant, permanentTools, tasks) {
    let budget = this.config.budget?.tokens;

    // Subtract tokens used by assistant configuration
    budget = Math.max(0, budget - assistant.content.tokens);

    // Subtract tokens used by permanent tools
    // Tools only have a token count on their descriptor as the "content"
    // is the function definition
    for (const tool of permanentTools) {
      budget = Math.max(0, budget - (tool.descriptor?.tokens || 0));
    }

    // Subtract tokens used by tasks
    for (const task of tasks) {
      budget = Math.max(0, budget - (task.descriptor?.tokens || 0));
    }

    this.debug("Adjusted budget", {
      before: this.config.budget.tokens,
      after: budget,
    });

    return budget;
  }

  /**
   * Creates memory window without performing vector search
   * @param {import("@copilot-ld/libtype").common.Conversation} conversation - Conversation object
   * @param {import("@copilot-ld/libtype").common.Assistant} assistant - Assistant configuration
   * @param {object[]} tasks - Tasks array
   * @param {number} budget - Token budget
   * @returns {Promise<{messages: import("@copilot-ld/libtype").common.Message[], tools: import("@copilot-ld/libtype").tool.ToolDefinition[]}>} Memory results
   * @private
   */
  async #getMemoryWindow(conversation, assistant, tasks, budget) {
    const allocation = this.config.budget?.allocation;

    const window = await this.#memoryClient.GetWindow(
      new memory.WindowRequest({
        for: String(conversation.id),
        budget,
        allocation: allocation
          ? new memory.WindowRequest.Allocation({
              tools: Math.round(budget * allocation.tools),
              history: Math.round(budget * allocation.history),
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

    let rememberedTools = [];
    if (window?.tools.length > 0) {
      rememberedTools = await toTools(window.tools, this.#resourceIndex);
    }

    return { messages, rememberedTools };
  }

  /**
   * Executes a single tool call and returns the result
   * @param {import("@copilot-ld/libtype").tool.ToolDefinition} toolCall - Tool call object
   * @param {number} max_tokens - Maximum tokens for tool call
   * @param {string} github_token - GitHub token for LLM calls
   * @returns {Promise<import("@copilot-ld/libtype").common.Message>} Tool result message
   * @private
   */
  async #executeToolCall(toolCall, max_tokens, github_token) {
    try {
      // Pass-on budget filter that tools must apply to results
      toolCall.filter = tool.QueryFilter.fromObject({
        threshold: this.config?.threshold,
        limit: this.config?.limit,
        max_tokens,
      });

      // Pass-on github_token for tools that may need it
      toolCall.github_token = github_token;

      // Execute the tool call via Tool service
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
            message: error.message,
            code: error.code,
          },
        }),
      });
    }
  }

  /**
   * Processes tool calls for a completion choice
   * @param {import("@copilot-ld/libtype").common.Choice} choiceWithToolCalls - Completion choice with tool calls
   * @param {import("@copilot-ld/libtype").common.Message[]} messages - Array of messages
   * @param {number} max_tokens - Maximum tokens for tool calls
   * @param {string} github_token - GitHub token for LLM calls
   * @returns {Promise<void>}
   * @private
   */
  async #processToolCalls(
    choiceWithToolCalls,
    messages,
    max_tokens,
    github_token,
  ) {
    this.debug("Processing tool", {
      calls: choiceWithToolCalls.message.tool_calls.length,
    });

    // XXX TODO The messages and the results go no where. Save as resources and append to memory?

    // Add the assistant's message with tool calls to conversation
    messages.push(choiceWithToolCalls.message);

    // Execute each tool call and collect results
    for (const toolCall of choiceWithToolCalls.message.tool_calls) {
      const toolResult = await this.#executeToolCall(
        toolCall,
        max_tokens,
        github_token,
      );
      messages.push(toolResult);
    }
  }

  /**
   * Handles the tool execution loop with LLM completions
   * @param {import("@copilot-ld/libtype").common.Message[]} messages - Array of messages for LLM
   * @param {import("@copilot-ld/libtype").tool.ToolDefinition[]} tools - Array of available tools
   * @param {number} max_tokens - Maximum tokens for tool calls
   * @param {string} github_token - GitHub token for LLM calls
   * @returns {Promise<import("@copilot-ld/libtype").llm.CompletionsResponse>} LLM completions response
   * @private
   */
  async #executeToolLoop(messages, tools, max_tokens, github_token) {
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
        github_token,
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

      await this.#processToolCalls(
        choiceWithToolCalls,
        messages,
        max_tokens,
        github_token,
      );
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

    const { assistant, permanentTools, conversation, message, tasks } =
      await this.#setupConversation(req);

    if (message?.id) {
      this.#memoryClient.Append(
        new memory.AppendRequest({
          for: conversation.id.toString(),
          identifiers: [message.id],
        }),
      );

      const budget = this.#getBudget(assistant, permanentTools, tasks);

      const { messages, rememberedTools } = await this.#getMemoryWindow(
        conversation,
        assistant,
        tasks,
        budget,
      );

      // Combine permanent and remembered tools, de-duplicating by identifier
      const tools = [
        ...permanentTools,
        ...rememberedTools.filter(
          (rt) => !permanentTools.find((pt) => pt.id?.name === rt.id?.name),
        ),
      ];

      // Special parameters to pass down to tools and LLM calls
      const max_tokens = Math.round(
        budget * this.config.budget?.allocation?.results,
      );
      const github_token = req.github_token;

      const completions = await this.#executeToolLoop(
        messages,
        tools,
        max_tokens,
        github_token,
      );

      // Step 7: Save the response
      if (completions?.choices?.length > 0) {
        this.debug("Completion received", {
          choices: completions.choices.length,
        });
        completions.choices[0].message.withIdentifier(conversation.id);
        this.#resourceIndex.put(completions.choices[0].message);
        this.#memoryClient.Append(
          new memory.AppendRequest({
            for: conversation.id.toString(),
            identifiers: [completions.choices[0].message.id],
          }),
        );
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
