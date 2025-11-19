/* eslint-env node */
import { llm, tool, common, memory } from "@copilot-ld/libtype";

/**
 * Focused tool execution class that handles individual tool calls,
 * processing results, error handling, and tool deduplication
 */
export class AgentHands {
  #config;
  #callbacks;
  #resourceIndex;

  /**
   * Creates a new AgentHands instance
   * @param {import("./index.js").AgentConfig} config - Agent configuration
   * @param {import("./index.js").Callbacks} callbacks - Service callback functions
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for loading resources
   */
  constructor(config, callbacks, resourceIndex) {
    if (!config) throw new Error("config is required");
    if (!callbacks) throw new Error("callbacks is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#config = config;
    this.#callbacks = callbacks;
    this.#resourceIndex = resourceIndex;
  }

  /**
   * Handles the tool execution loop with LLM completions
   * @param {string} resourceId - Resource ID for memory appends
   * @param {object[]} messages - Array of messages for LLM
   * @param {object[]} tools - Array of available tools
   * @param {number} maxTokens - Maximum tokens for tool calls
   * @param {string} githubToken - GitHub token for LLM calls
   * @param {string} [model] - Optional model override for LLM service
   * @returns {Promise<object>} LLM completions response
   */
  async executeToolLoop(
    resourceId,
    messages,
    tools,
    maxTokens,
    githubToken,
    model,
  ) {
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
        model,
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
        resourceId,
        choiceWithToolCalls,
        messages,
        maxTokens,
        githubToken,
        model,
      );
      currentIteration++;
    }

    return completions;
  }

  /**
   * Executes a single tool call and returns the result
   * @param {string} resourceId - Resource ID for memory appends
   * @param {object} toolCall - Tool call object
   * @param {number} maxTokens - Maximum tokens for tool call
   * @param {string} githubToken - GitHub token for LLM calls
   * @param {string} [_model] - Optional model override (unused in tool calls)
   * @returns {Promise<import("./index.js").ToolExecutionResult>} Tool result
   */
  async executeToolCall(resourceId, toolCall, maxTokens, githubToken, _model) {
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
      const toolCallResult = await this.#callbacks.tool.call(toolDefinition);

      // Process the tool call result
      const content = await this.#processToolCallResult(
        resourceId,
        toolCallResult,
      );

      const message = tool.ToolCallMessage.fromObject({
        role: "tool",
        tool_call_id: toolCall.id,
        content,
      });

      return {
        message,
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
   * Processes tool call result by loading resources and converting to strings
   * @param {string} resourceId - Resource ID for memory appends
   * @param {object} result - Tool service response (common.Message)
   * @returns {Promise<object|string[]>} Processed result
   * @private
   */
  async #processToolCallResult(resourceId, result) {
    // If result has string content, return immediately
    if (typeof result.content === "string" && result.content !== "") {
      return result.content;
    }

    // If result has identifiers array, load the resources
    if (
      result?.identifiers &&
      Array.isArray(result.identifiers) &&
      result.identifiers.length > 0
    ) {
      // Append all identifiers to memory
      await this.#callbacks.memory.append(
        memory.AppendRequest.fromObject({
          resource_id: resourceId,
          identifiers: result.identifiers,
        }),
      );

      // Load resources using root actor
      const actor = "common.System.root";
      const resources = await this.#resourceIndex.get(
        result.identifiers,
        actor,
      );

      // Convert resources to content strings
      return resources
        .map((resource) => resource.content)
        .filter((text) => text.length > 0);
    }

    // Not a valid tool call result
    throw new Error("Invalid tool call result: no content or identifiers");
  }

  /**
   * Processes tool calls for a completion choice
   * @param {string} resourceId - Resource ID for memory appends
   * @param {object} choiceWithToolCalls - Completion choice with tool calls
   * @param {object[]} messages - Array of messages
   * @param {number} maxTokens - Maximum tokens for tool calls
   * @param {string} githubToken - GitHub token for LLM calls
   * @param {string} [model] - Optional model override for LLM service
   * @returns {Promise<void>}
   */
  async processToolCalls(
    resourceId,
    choiceWithToolCalls,
    messages,
    maxTokens,
    githubToken,
    model,
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
        resourceId,
        toolCall,
        perToolLimit,
        githubToken,
        model,
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
