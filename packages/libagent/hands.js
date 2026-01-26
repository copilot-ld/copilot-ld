import { llm, tool, common, memory } from "@copilot-ld/libtype";

/**
 * Focused tool execution class that handles individual tool calls,
 * processing results, and error handling
 */
export class AgentHands {
  #callbacks;
  #resourceIndex;

  /**
   * Creates a new AgentHands instance
   * @param {import("./index.js").Callbacks} callbacks - Service callback functions
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for loading resources
   */
  constructor(callbacks, resourceIndex) {
    if (!callbacks) throw new Error("callbacks is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#callbacks = callbacks;
    this.#resourceIndex = resourceIndex;
  }

  /**
   * Handles the tool execution loop with LLM completions and budget tracking
   * @param {string} conversationId - Conversation resource ID
   * @param {object} callbacks - Message handling callbacks
   * @param {(msgs: object[]) => Promise<object[]>} callbacks.saveToServer - Save messages to server-side indices
   * @param {(msg: object) => void} callbacks.streamToClient - Stream message to client immediately
   * @param {object} [options] - Execution options
   * @param {string} [options.llmToken] - LLM API token for LLM calls
   * @param {string} [options.model] - Optional model override for LLM service
   * @returns {Promise<void>}
   */
  async executeToolLoop(conversationId, callbacks, options = {}) {
    const { saveToServer, streamToClient } = callbacks;
    const { llmToken, model } = options;
    let maxIterations = 100; // TODO: configurable limit
    let currentIteration = 0;

    // Get initial available budget from memory service
    const budgetRequest = memory.BudgetRequest.fromObject({
      resource_id: conversationId,
      model,
    });
    const budgetInfo = await this.#callbacks.memory.getBudget(budgetRequest);
    let remainingBudget = budgetInfo.available;

    while (currentIteration < maxIterations) {
      // Build request with resource_id - LLM service fetches memory window internally
      const completionRequest = llm.CompletionsRequest.fromObject({
        resource_id: conversationId,
        llm_token: llmToken,
        model,
      });

      const completions =
        await this.#callbacks.llm.createCompletions(completionRequest);

      if (!completions?.choices?.length) {
        break;
      }

      const choice = completions.choices[0];
      const finishReason = choice.finish_reason;

      // If we have tool calls, process them
      if (choice.message?.tool_calls?.length > 0) {
        // Stream assistant message immediately, batch write later
        const assistantMessage = common.Message.fromObject(choice.message);
        streamToClient(assistantMessage);

        // Process tool calls - returns messages in order
        const { messages, tokensUsed, handoffPrompt } =
          await this.processToolCalls(choice.message.tool_calls, {
            resourceId: conversationId,
            llmToken,
            maxTokens: remainingBudget,
          });

        // Batch write: assistant message + all tool results
        await saveToServer([assistantMessage, ...messages]);

        // Draw down budget by tokens used
        remainingBudget = Math.max(0, remainingBudget - tokensUsed);

        // Check for handoff - inject handoff prompt as user message
        if (handoffPrompt) {
          const handoffMessage = common.Message.fromObject({
            role: "user",
            content: handoffPrompt,
          });
          await saveToServer([handoffMessage]);
        }
      } else if (finishReason === "tool_calls") {
        // LLM indicated tool_calls but array is empty - likely a parsing error
        // Save message and continue loop to let LLM try again
        const msg = common.Message.fromObject(choice.message);
        streamToClient(msg);
        await saveToServer([msg]);
      } else if (finishReason === "length") {
        // Response was truncated due to token limit
        // Save what we have and continue loop to let LLM continue
        const msg = common.Message.fromObject(choice.message);
        streamToClient(msg);
        await saveToServer([msg]);
      } else {
        // finish_reason is "stop" or other - this is the final message
        const msg = common.Message.fromObject(choice.message);
        streamToClient(msg);
        await saveToServer([msg]);
        break;
      }

      currentIteration++;
    }
  }

  /**
   * Executes a single tool call and returns the result message
   * @param {object} toolCall - Tool call object
   * @param {string} llm_token - LLM API token for LLM calls
   * @param {string} resourceId - Current conversation resource ID
   * @param {number} [maxTokens] - Maximum tokens for tool result
   * @returns {Promise<{message: object, result: object|null}>} Tool result message and raw result
   */
  async executeToolCall(toolCall, llm_token, resourceId, maxTokens = null) {
    try {
      // Set max_tokens filter if budget available
      if (maxTokens && maxTokens > 0) {
        toolCall.filter = toolCall.filter || {};
        toolCall.filter.max_tokens = String(maxTokens);
      }

      toolCall.llm_token = llm_token;
      toolCall.resource_id = resourceId;
      const toolCallResult = await this.#callbacks.tool.call(toolCall);

      // Process the tool call result
      const { subjects, content } =
        await this.#processToolCallResult(toolCallResult);

      return {
        message: tool.ToolCallMessage.fromObject({
          id: { subjects },
          role: "tool",
          tool_call_id: toolCall.id,
          content,
        }),
        result: toolCallResult,
      };
    } catch (error) {
      return {
        message: tool.ToolCallMessage.fromObject({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: {
              type: "tool_execution_error",
              message: error.message,
              code: error.code,
            },
          }),
        }),
        result: null,
      };
    }
  }

  /**
   * Processes tool call result by loading resources and converting to strings
   * @param {object} result - Tool service response (common.Message)
   * @returns {Promise<{subjects: string[], content: string}>} Processed result with subjects and content
   * @private
   */
  async #processToolCallResult(result) {
    // If result has string content, return immediately with empty subjects
    if (typeof result.content === "string" && result.content !== "") {
      return { subjects: [], content: result.content };
    }

    // If result has identifiers array (including empty), process it
    if (result?.identifiers && Array.isArray(result.identifiers)) {
      // Empty identifiers array means query returned no results
      if (result.identifiers.length === 0) {
        return { subjects: [], content: "No results found." };
      }

      // Extract all subjects from the identifiers
      const subjects = result.identifiers.flatMap((id) => id.subjects || []);

      // Load resources using root actor
      // Convert Identifier objects to string keys for resource lookup
      const actor = "common.System.root";
      const resources = await this.#resourceIndex.get(
        result.identifiers.map((id) => String(id)),
        actor,
      );

      // Convert resources to content strings
      const content = resources
        .map((resource) => resource.content)
        .filter((text) => text.length > 0)
        .join("\n\n");

      return { subjects, content };
    }

    // Not a valid tool call result
    throw new Error("Invalid tool call result: no content or identifiers");
  }

  /**
   * Processes tool calls from an assistant message using parallel execution
   * Returns messages in conversation order for batch writing
   * @param {import("@copilot-ld/libtype").tool.ToolCall[]} toolCalls - Array of tool calls to process
   * @param {object} [options] - Execution options
   * @param {string} [options.resourceId] - Current conversation resource ID
   * @param {string} [options.llmToken] - LLM API token for LLM calls
   * @param {number} [options.maxTokens] - Maximum tokens for tool results
   * @returns {Promise<{messages: object[], tokensUsed: number, handoffPrompt: string|null}>} Messages in order, tokens used, and handoff prompt if any
   */
  async processToolCalls(toolCalls, options = {}) {
    const { resourceId, llmToken, maxTokens } = options;

    // Split budget evenly across all tool calls
    const budgetPerCall = maxTokens
      ? Math.floor(maxTokens / toolCalls.length)
      : undefined;

    // Execute all tool calls in parallel
    const results = await Promise.all(
      toolCalls.map(async (toolCall, index) => {
        try {
          const execResult = await this.executeToolCall(
            toolCall,
            llmToken,
            resourceId,
            budgetPerCall,
          );
          return { index, ...execResult, toolCall };
        } catch (error) {
          return {
            index,
            message: tool.ToolCallMessage.fromObject({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: {
                  type: "tool_execution_error",
                  message: String(error),
                },
              }),
            }),
            result: null,
            toolCall,
          };
        }
      }),
    );

    // Sort by original index to maintain conversation order
    results.sort((a, b) => a.index - b.index);

    // Collect messages in order
    const messages = results.map(({ message }) => message);

    // Calculate totals and check for handoff
    let totalTokensUsed = 0;
    let handoffPrompt = null;

    for (const { message, result, toolCall } of results) {
      totalTokensUsed += message.id?.tokens || 0;

      if (toolCall.function?.name === "run_handoff" && result?.content) {
        try {
          handoffPrompt = JSON.parse(result.content).prompt;
        } catch {
          /* ignore */
        }
      }
    }

    return { messages, tokensUsed: totalTokensUsed, handoffPrompt };
  }
}
