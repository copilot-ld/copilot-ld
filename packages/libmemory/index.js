/* eslint-env node */
import { common, tool } from "@copilot-ld/libtype";
import { getModelBudget } from "./models.js";

// Re-export model utilities
export { getModelBudget } from "./models.js";

/**
 * Memory window builder for managing conversation history with budget constraints
 * Builds complete message arrays including assistant, tools, and conversation history
 */
export class MemoryWindow {
  #resourceId;
  #resourceIndex;
  #memoryIndex;

  /**
   * Creates a new MemoryWindow instance for a specific resource
   * @param {string} resourceId - The resource ID (conversation ID)
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for loading resources
   * @param {import("./index/memory.js").MemoryIndex} memoryIndex - Memory index instance for this specific resource
   */
  constructor(resourceId, resourceIndex, memoryIndex) {
    if (!resourceId) throw new Error("resourceId is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!memoryIndex) throw new Error("memoryIndex is required");

    this.#resourceId = resourceId;
    this.#resourceIndex = resourceIndex;
    this.#memoryIndex = memoryIndex;
  }

  /**
   * Calculates available budget for user content (excluding assistant and tools overhead)
   * @param {string} model - Model name
   * @returns {Promise<{total: number, overhead: number, available: number}>} Budget breakdown
   */
  async calculateBudget(model) {
    if (!model) throw new Error("model is required");

    const total = getModelBudget(model);
    const actor = "common.System.root";

    // Load conversation to get assistant_id
    const [conversation] = await this.#resourceIndex.get(
      [this.#resourceId],
      actor,
    );
    if (!conversation) {
      throw new Error(`Conversation not found: ${this.#resourceId}`);
    }

    // Load assistant
    const [assistant] = await this.#resourceIndex.get(
      [conversation.assistant_id],
      actor,
    );
    if (!assistant) {
      throw new Error(`Assistant not found: ${conversation.assistant_id}`);
    }

    // Load tools from assistant configuration
    const toolNames = assistant.tools || [];
    const functionIds = toolNames.map((name) => `tool.ToolFunction.${name}`);
    const functions = await this.#resourceIndex.get(functionIds, actor);

    // Calculate overhead (assistant + tools tokens)
    let overhead = assistant.id?.tokens || 0;
    for (const f of functions) {
      overhead += f.id?.tokens || 0;
    }

    return {
      total,
      overhead,
      available: Math.max(0, total - overhead),
    };
  }

  /**
   * Builds a complete memory window with messages and tools
   * @param {string} model - Model name to determine budget
   * @returns {Promise<{messages: object[], tools: object[], temperature: number}>} Complete window with messages, tools, and temperature
   */
  async build(model) {
    if (!model) {
      throw new Error("model is required");
    }

    const { total, overhead } = await this.calculateBudget(model);
    const historyBudget = total - overhead;

    const actor = "common.System.root";

    // Load conversation to get assistant_id
    const [conversation] = await this.#resourceIndex.get(
      [this.#resourceId],
      actor,
    );
    if (!conversation) {
      throw new Error(`Conversation not found: ${this.#resourceId}`);
    }

    // Load assistant
    const [assistant] = await this.#resourceIndex.get(
      [conversation.assistant_id],
      actor,
    );
    if (!assistant) {
      throw new Error(`Assistant not found: ${conversation.assistant_id}`);
    }

    // Load tools from assistant configuration
    const toolNames = assistant.tools || [];
    const functionIds = toolNames.map((name) => `tool.ToolFunction.${name}`);
    const functions = await this.#resourceIndex.get(functionIds, actor);

    // Wrap the function in a call object
    const tools = functions.map((f) => {
      return tool.ToolCall.fromObject({
        type: "function",
        function: f,
      });
    });

    // Get conversation history within budget
    const identifiers = await this.#filterByBudget(historyBudget);

    // Load full message objects from identifiers
    const history = await this.#resourceIndex.get(identifiers, actor);

    // Build complete messages array: assistant + conversation history
    const messages = [
      // Create a system message from assistant
      common.Message.fromObject({
        role: "system",
        ...assistant,
      }),
      ...history,
    ];

    // Extract temperature from assistant (default 0.7 if not specified)
    const temperature = assistant.temperature ?? 0.7;

    return { messages, tools, temperature };
  }

  /**
   * Filters memory identifiers by token budget
   * @param {number} budget - Token budget
   * @returns {Promise<import("@copilot-ld/libtype").resource.Identifier[]>} Filtered identifiers
   * @private
   */
  async #filterByBudget(budget) {
    const allIdentifiers = await this.#memoryIndex.queryItems();

    let totalTokens = 0;
    const filtered = [];

    // Process newest first, then break when budget is reached
    for (let i = allIdentifiers.length - 1; i >= 0; i--) {
      const identifier = allIdentifiers[i];
      if (identifier.tokens === undefined || identifier.tokens === null) {
        throw new Error(
          `Identifier missing tokens field: ${JSON.stringify(identifier)}`,
        );
      }

      if (totalTokens + identifier.tokens <= budget) {
        filtered.unshift(identifier);
        totalTokens += identifier.tokens;
      } else {
        break;
      }
    }

    // Ensure tool call integrity: tool messages must be preceded by assistant message
    while (filtered.length > 0 && filtered[0].type === "tool.ToolCallMessage") {
      filtered.shift();
    }

    return filtered;
  }

  /**
   * Appends identifiers to memory
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Array of identifiers to append
   * @returns {Promise<void>}
   */
  async append(identifiers) {
    for (const identifier of identifiers) {
      await this.#memoryIndex.add(identifier);
    }
  }
}
