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
   * @param {(msg: object) => Promise<void>} saveMessage - Callback for saving messages
   * @param {object} [options] - Execution options
   * @param {string} [options.llmToken] - LLM API token for LLM calls
   * @param {string} [options.model] - Optional model override for LLM service
   * @returns {Promise<void>}
   */
  async executeToolLoop(conversationId, saveMessage, options = {}) {
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
        await saveMessage(common.Message.fromObject(choice.message));
        const { tokensUsed, handoffPrompt } = await this.processToolCalls(
          choice.message.tool_calls,
          saveMessage,
          { resourceId: conversationId, llmToken, maxTokens: remainingBudget },
        );

        // Draw down budget by tokens used
        remainingBudget = Math.max(0, remainingBudget - tokensUsed);

        // Check for handoff - inject handoff prompt as user message
        if (handoffPrompt) {
          const handoffMessage = common.Message.fromObject({
            role: "user",
            content: handoffPrompt,
          });
          await saveMessage(handoffMessage);
        }
      } else if (finishReason === "tool_calls") {
        // LLM indicated tool_calls but array is empty - likely a parsing error
        // Save message and continue loop to let LLM try again
        await saveMessage(common.Message.fromObject(choice.message));
      } else if (finishReason === "length") {
        // Response was truncated due to token limit
        // Save what we have and continue loop to let LLM continue
        await saveMessage(common.Message.fromObject(choice.message));
      } else {
        // finish_reason is "stop" or other - this is the final message
        await saveMessage(common.Message.fromObject(choice.message));
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

    // If result has identifiers array, load the resources
    if (
      result?.identifiers &&
      Array.isArray(result.identifiers) &&
      result.identifiers.length > 0
    ) {
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
   * Processes tool calls from an assistant message using fully sequential execution
   * @param {import("@copilot-ld/libtype").tool.ToolCall[]} toolCalls - Array of tool calls to process
   * @param {(msg: object) => Promise<void>} saveMessage - Callback for saving messages
   * @param {object} [options] - Execution options
   * @param {string} [options.resourceId] - Current conversation resource ID
   * @param {string} [options.llmToken] - LLM API token for LLM calls
   * @param {number} [options.maxTokens] - Maximum tokens for tool results
   * @param {number} [options.batchSize] - Ignored (sequential execution)
   * @returns {Promise<{tokensUsed: number, handoffPrompt: string|null}>} Tokens used and handoff prompt if any
   */
  async processToolCalls(toolCalls, saveMessage, options = {}) {
    const { resourceId, llmToken, maxTokens } = options;
    let totalTokensUsed = 0;
    let remainingBudget = maxTokens;
    let handoffPrompt = null;

    // Process tool calls fully sequentially to ensure proper message ordering
    for (const toolCall of toolCalls) {
      try {
        const { message, result } = await this.executeToolCall(
          toolCall,
          llmToken,
          resourceId,
          remainingBudget,
        );

        const tokensUsed = message.id?.tokens || 0;
        totalTokensUsed += tokensUsed;
        remainingBudget = Math.max(0, remainingBudget - tokensUsed);

        await saveMessage(message);

        // Check for handoff - extract prompt from run_handoff result content
        if (toolCall.function?.name === "run_handoff" && result?.content) {
          try {
            const handoffData = JSON.parse(result.content);
            handoffPrompt = handoffData.prompt;
          } catch {
            // Ignore parse errors
          }
        }
      } catch (error) {
        // Create error message for failed tool call
        const errorMessage = tool.ToolCallMessage.fromObject({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: {
              type: "tool_execution_error",
              message: String(error),
            },
          }),
        });
        await saveMessage(errorMessage);
      }
    }

    return { tokensUsed: totalTokensUsed, handoffPrompt };
  }
}
