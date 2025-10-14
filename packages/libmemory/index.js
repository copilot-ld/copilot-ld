/* eslint-env node */
import { IndexBase } from "@copilot-ld/libutil";

/**
 * Memory index for managing conversation memory using JSONL storage
 * Extends IndexBase to provide memory-specific operations with deduplication
 * Each instance manages memory for a single resource/conversation
 */
export class MemoryIndex extends IndexBase {
  /**
   * Adds identifiers to memory
   * @param {import("@copilot-ld/libtype").resource.Identifier} identifier - Identifier to add
   * @returns {Promise<void>}
   */
  async addItem(identifier) {
    const item = {
      id: String(identifier),
      identifier,
    };

    // Use parent class to update index in memory and on disk
    await super.addItem(item);
  }
}

/**
 * Memory filter for budget-based filtering and tool/history separation
 */
export class MemoryFilter {
  /**
   * Splits memory identifiers into tools and history based on type
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} memory - Memory identifiers to split
   * @returns {{tools: import("@copilot-ld/libtype").resource.Identifier[], history: import("@copilot-ld/libtype").resource.Identifier[]}} Split results
   */
  static splitToolsAndHistory(memory) {
    if (!Array.isArray(memory)) return { tools: [], history: [] };

    const tools = memory.filter((identifier) =>
      identifier.type?.startsWith("tool.ToolFunction"),
    );
    const history = memory.filter(
      (identifier) => !identifier.type?.startsWith("tool.ToolFunction"),
    );

    return { tools, history };
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

    // Sort by score (descending) if available, otherwise preserve order
    const sorted = identifiers.slice().sort((a, b) => {
      if (a.score !== undefined && b.score !== undefined) {
        return b.score - a.score;
      }
      return 0;
    });

    for (const identifier of sorted) {
      const tokens = identifier.tokens || 0;
      if (totalBudget + tokens <= budget) {
        filtered.push(identifier);
        totalBudget += tokens;
      } else {
        // Stop when budget would be exceeded
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
   * @param {MemoryIndex} index - Memory index instance for this specific resource
   */
  constructor(index) {
    if (!index) throw new Error("index is required");
    this.#index = index;
  }

  /**
   * Builds a memory window with budget allocation
   * @param {number} budget - Total token budget
   * @param {{tools: number, history: number}} allocation - Budget allocation ratios (0-1)
   * @returns {Promise<{tools: import("@copilot-ld/libtype").resource.Identifier[], history: import("@copilot-ld/libtype").resource.Identifier[]}>} Memory window results
   */
  async build(budget, allocation) {
    const identifiers = await this.#index.queryItems();
    const { tools, history } = MemoryFilter.splitToolsAndHistory(identifiers);

    if (!budget || !allocation?.tools || !allocation?.history) {
      throw new Error("Budget allocation of tools and history is required");
    }

    // Apply budget filtering with calculated budgets
    const filteredTools = MemoryFilter.filterByBudget(
      tools,
      Math.round(budget * allocation.tools),
    );
    const filteredHistory = MemoryFilter.filterByBudget(
      history,
      Math.round(budget * allocation.history),
    );

    return {
      tools: filteredTools,
      history: filteredHistory,
    };
  }

  /**
   * Appends identifiers to memory
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Array of identifiers to append
   * @returns {Promise<void>}
   */
  async append(identifiers) {
    for (const identifier of identifiers) {
      await this.#index.addItem(identifier);
    }
  }
}
