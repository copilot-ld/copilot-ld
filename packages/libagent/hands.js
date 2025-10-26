/* eslint-env node */
import { llm, tool, common } from "@copilot-ld/libtype";

/**
 * Focused tool execution class that handles individual tool calls,
 * processing results, error handling, and tool deduplication
 */
export class AgentHands {
  #config;
  #callbacks;

  /**
   * Creates a new AgentHands instance
   * @param {import("./index.js").AgentConfig} config - Agent configuration
   * @param {import("./index.js").Callbacks} callbacks - Service callback functions
   */
  constructor(config, callbacks) {
    if (!config) throw new Error("config is required");
    if (!callbacks) throw new Error("callbacks is required");

    this.#config = config;
    this.#callbacks = callbacks;
  }

  /**
   * Handles the tool execution loop with LLM completions
   * @param {object[]} messages - Array of messages for LLM
   * @param {object[]} tools - Array of available tools
   * @param {number} maxTokens - Maximum tokens for tool calls
   * @param {string} githubToken - GitHub token for LLM calls
   * @returns {Promise<object>} LLM completions response
   */
  async executeToolLoop(messages, tools, maxTokens, githubToken) {
    let completions = {};
    let maxIterations = 10;
    let currentIteration = 0;

    // Step 6: Inner loop with tool calls
    while (currentIteration < maxIterations) {
      // Build request object using fromObject for proper initialization
      const completionRequest = llm.CompletionsRequest.fromObject({
        messages,
        tools,
        temperature: this.#config.temperature,
        github_token: githubToken,
      });

      completions =
        await this.#callbacks.llm.createCompletions(completionRequest);

      if (!completions?.choices?.length) {
        break;
      }

      // Find the first choice with tool calls
      const choiceWithToolCalls = completions.choices.find(
        (choice) => choice.message?.tool_calls?.length > 0,
      );

      // If no tool calls found in any choice, we're done
      if (!choiceWithToolCalls) {
        break;
      }

      await this.processToolCalls(
        choiceWithToolCalls,
        messages,
        maxTokens,
        githubToken,
      );
      currentIteration++;
    }

    return completions;
  }

  /**
   * Executes a single tool call and returns the result
   * @param {object} toolCall - Tool call object
   * @param {number} maxTokens - Maximum tokens for tool call
   * @param {string} githubToken - GitHub token for LLM calls
   * @returns {Promise<import("./index.js").ToolExecutionResult>} Tool result
   */
  async executeToolCall(toolCall, maxTokens, githubToken) {
    try {
      // Create proper ToolDefinition for the service call
      const toolDefinition = tool.ToolDefinition.fromObject({
        type: "function",
        function: tool.ToolFunction.fromObject({
          name: toolCall.function?.name,
          arguments: toolCall.function?.arguments,
        }),
        id: toolCall.id,
        filter: tool.QueryFilter.fromObject({
          threshold: this.#config?.threshold,
          limit: this.#config?.limit,
          max_tokens: maxTokens,
        }),
        github_token: githubToken,
      });

      // Execute the tool call via Tool service
      const toolResult = await this.#callbacks.tool.call(toolDefinition);

      return {
        message: toolResult,
        success: true,
        error: null,
      };
    } catch (error) {
      // Return error as tool result
      const errorMessage = common.Message.fromObject({
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

      return {
        message: errorMessage,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Processes tool calls for a completion choice
   * @param {object} choiceWithToolCalls - Completion choice with tool calls
   * @param {object[]} messages - Array of messages
   * @param {number} maxTokens - Maximum tokens for tool calls
   * @param {string} githubToken - GitHub token for LLM calls
   * @returns {Promise<void>}
   */
  async processToolCalls(
    choiceWithToolCalls,
    messages,
    maxTokens,
    githubToken,
  ) {
    // Add the assistant's message with tool calls to conversation
    messages.push(choiceWithToolCalls.message);

    // Calculate per-tool token limit to prevent message bloat
    // Divide token budget fairly across all tool calls before service execution
    const toolCallCount = choiceWithToolCalls.message.tool_calls.length;
    const perToolLimit = Math.floor(maxTokens / toolCallCount);

    // Execute each tool call with allocated budget
    for (const toolCall of choiceWithToolCalls.message.tool_calls) {
      const toolResult = await this.executeToolCall(
        toolCall,
        perToolLimit,
        githubToken,
      );

      messages.push(toolResult.message);
    }
  }

  /**
   * Merges permanent and remembered tools, removing duplicates
   * @param {object[]} permanentTools - Permanent tool definitions
   * @param {object[]} rememberedTools - Tools from memory
   * @returns {object[]} Merged and deduplicated tools
   */
  mergeTools(permanentTools, rememberedTools) {
    // Combine permanent and remembered tools, de-duplicating by identifier
    const tools = [
      ...permanentTools,
      ...rememberedTools.filter(
        (rt) => !permanentTools.find((pt) => pt.id?.name === rt.id?.name),
      ),
    ];

    return tools;
  }
}
