/* eslint-env node */

/**
 * Memory filter for budget-based filtering and tool/history separation
 */
export class MemoryFilter {
  /**
   * Split resources into specific types
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} memory - Memory identifiers to split
   * @returns {object} Split results
   */
  static splitResources(memory) {
    if (!Array.isArray(memory)) {
      return {
        tools: [],
        context: [],
        conversation: [],
      };
    }

    const tools = memory.filter((identifier) =>
      identifier.type?.startsWith("tool.ToolFunction"),
    );

    const conversation = memory.filter(
      (identifier) =>
        identifier.type?.startsWith("common.Message") &&
        identifier.parent?.startsWith("common.Conversation"),
    );

    // Everything else is considered context
    const context = memory.filter(
      (identifier) =>
        !identifier.type?.startsWith("tool.ToolFunction") &&
        !identifier.parent?.startsWith("common.Conversation"),
    );

    return {
      tools,
      context,
      conversation,
    };
  }

  /**
   * Filters identifiers based on token budget allocation
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Array of identifiers to filter
   * @param {number} budget - Maximum tokens allowed
   * @returns {import("@copilot-ld/libtype").resource.Identifier[]} Filtered identifiers within budget
   */
  static filterByBudget(identifiers, budget) {
    if (!budget || budget <= 0) return [];
    if (!Array.isArray(identifiers)) return [];

    let totalBudget = 0;
    const filtered = [];

    const sorted = identifiers.slice().sort((a, b) => {
      if (a.score !== undefined && b.score !== undefined) {
        return b.score - a.score;
      }
      return 0;
    });

    for (const identifier of sorted) {
      if (identifier.tokens === undefined || identifier.tokens === null) {
        throw new Error(
          `Identifier missing tokens field: ${JSON.stringify(identifier)}`,
        );
      }

      if (totalBudget + identifier.tokens <= budget) {
        filtered.push(identifier);
        totalBudget += identifier.tokens;
      } else {
        break;
      }
    }

    return filtered;
  }
}

/**
 * Memory window builder for managing memory windows with budget allocation
 * Works with a specific MemoryIndex instance for a single resource
 */
export class MemoryWindow {
  #index;

  /**
   * Creates a new MemoryWindow instance for a specific resource
   * @param {import("./index/memory.js").MemoryIndex} index - Memory index instance for this specific resource
   */
  constructor(index) {
    if (!index) throw new Error("index is required");
    this.#index = index;
  }

  /**
   * Builds a memory window with budget allocation
   * @param {number} budget - Total token budget
   * @param {{tools: number, resources: number}} allocation - Budget allocation ratios (0-1)
   * @returns {Promise<{tools: import("@copilot-ld/libtype").resource.Identifier[], identifiers: import("@copilot-ld/libtype").resource.Identifier[]}>} Memory window results
   */
  async build(budget, allocation) {
    const identifiers = await this.#index.queryItems();
    const { tools, context, conversation } =
      MemoryFilter.splitResources(identifiers);

    if (
      !budget ||
      !allocation?.tools ||
      !allocation?.context ||
      !allocation?.conversation
    ) {
      throw new Error(
        "Budget allocation is required: tools, context, conversation",
      );
    }

    const filteredTools = MemoryFilter.filterByBudget(
      tools,
      Math.round(budget * allocation.tools),
    );
    const filteredContext = MemoryFilter.filterByBudget(
      context,
      Math.round(budget * allocation.context),
    );
    const filteredConversation = MemoryFilter.filterByBudget(
      conversation,
      Math.round(budget * allocation.conversation),
    );

    return {
      tools: filteredTools,
      context: filteredContext,
      conversation: filteredConversation,
    };
  }

  /**
   * Appends identifiers to memory
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Array of identifiers to append
   * @returns {Promise<void>}
   */
  async append(identifiers) {
    for (const identifier of identifiers) {
      await this.#index.add(identifier);
    }
  }
}
