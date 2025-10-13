/* eslint-env node */
import { services } from "@copilot-ld/librpc";

const { MemoryBase } = services;

/**
 * Memory service for managing transient resources and memory windows
 */
export class MemoryService extends MemoryBase {
  #storage;
  #lock = {};

  /**
   * Creates a new Memory service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage instance for memories
   * @param {(namespace: string) => import("@copilot-ld/libutil").Logger} [logFn] - Optional log factory
   */
  constructor(config, storage, logFn) {
    super(config, logFn);
    if (!storage) throw new Error("storage is required");

    this.#storage = storage;
  }

  /** @inheritdoc */
  async Append(req) {
    if (!req.for) throw new Error("for is required");

    // Aquire a lock in case clients append memory as a fire-and-forget call and
    // immediately wants read back the window
    this.#lock[req.for] = true;

    try {
      this.debug("Appending memory", {
        for: req.for,
        count: req.identifiers?.length || 0,
      });

      // Create memory key based on the resource it's for using JSON-ND format
      const key = `${req.for}.jsonl`;

      // Append identifiers directly to memory using JSON-ND format
      if (req.identifiers && req.identifiers.length > 0) {
        // Convert identifiers to JSON-ND format (one JSON object per line)
        const lines = req.identifiers
          .map((identifier) => JSON.stringify(identifier))
          .join("\n");

        // Use StorageInterface.append() for efficient appending (newline added automatically)
        await this.#storage.append(key, lines);
      }
    } finally {
      delete this.#lock[req.for];
    }

    return { accepted: req.for };
  }

  /** @inheritdoc */
  async GetWindow(req) {
    if (!req.for) throw new Error("for is required");

    this.debug("Getting memory window", {
      for: req.for,
      budget: req.budget || "unlimited",
    });

    const memory = await this.#loadMemory(req.for);
    const { tools, history } = await this.#splitToolsAndHistory(memory);

    // Apply budget filtering if allocation is provided
    const filteredTools = req.allocation
      ? this.#filterByBudget(tools, req.allocation.tools)
      : tools;
    const filteredHistory = req.allocation
      ? this.#filterByBudget(history, req.allocation.history)
      : history;

    if (req.allocation) {
      this.debug("Memory window allocation", {
        tools: req.allocation.tools,
        history: req.allocation.history,
      });
    }

    this.debug("Memory window contents", {
      tools: filteredTools.length,
      history: filteredHistory.length,
    });

    return {
      for: req.for,
      tools: filteredTools,
      history: filteredHistory,
    };
  }

  /**
   * Loads memory context for a given resource
   * @param {string} id - Resource identifier
   * @returns {Promise<Array>} Deduplicated context identifiers
   * @private
   */
  async #loadMemory(id) {
    let memory = [];
    const key = `${id}.jsonl`;

    // Wait for lock to be released if another append is in progress
    while (this.#lock[id]) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      // Storage automatically parses .jsonl files into arrays
      memory = await this.#storage.get(key);
      if (!Array.isArray(memory)) {
        memory = [];
      }
    } catch {
      // No memory found, return empty memory
      this.debug("No memory found", { for: id });
    }

    // De-duplicate by identifier
    const seen = new Set();
    return memory.filter((identifier) => {
      if (identifier.name && !seen.has(identifier.name)) {
        seen.add(identifier.name);
        return true;
      }
      return false;
    });
  }

  /**
   * Split tools and history from memory identifiers
   * @param {Array} memory - Memory identifiers
   * @returns {Promise<{tools: Array, history: Array}>} Object containing tools and history items
   * @private
   */
  async #splitToolsAndHistory(memory) {
    let tools = memory.filter((identifier) =>
      identifier.type?.startsWith("tool.ToolFunction"),
    );
    const history = memory.filter(
      (identifier) => !identifier.type?.startsWith("tool.ToolFunction"),
    );
    return { tools, history };
  }

  /**
   * Filters identifiers based on token budget allocation
   * @param {Array} identifiers - Array of resource identifiers
   * @param {number} budget - Maximum tokens allowed for this section
   * @returns {Array} Filtered identifiers within token budget
   * @private
   */
  #filterByBudget(identifiers, budget) {
    if (!budget || budget <= 0) {
      return [];
    }

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
