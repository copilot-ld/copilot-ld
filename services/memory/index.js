/* eslint-env node */
import { services } from "@copilot-ld/librpc";

const { MemoryBase } = services;

/**
 * Memory service for managing transient resources and memory windows
 */
export class MemoryService extends MemoryBase {
  #storage;
  #resourceIndex;
  #lock = {};

  /**
   * Creates a new Memory service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage instance for memories
   * @param {import("@copilot-ld/libresource").ResourceIndexInterface} resourceIndex - ResourceIndex instance for accessing resources
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, storage, resourceIndex, logFn) {
    super(config, logFn);
    if (!storage) throw new Error("storage is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#storage = storage;
    this.#resourceIndex = resourceIndex;
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

        this.debug("Memory appended successfully", {
          for: req.for,
          identifiers: req.identifiers.length,
        });
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
      dimensions: req.vector?.length || 0,
      budget: req.budget || "unlimited",
    });

    const context = await this.#loadMemoryContext(req.for);
    const tools = await this.#loadToolsForWindow(context);
    const history = await this.#loadHistoryForWindow(req.for);

    // Apply budget filtering if allocation is provided
    const filteredTools = req.allocation
      ? this.#filterByBudget(tools, req.allocation.tools)
      : tools;
    const filteredContext = req.allocation
      ? this.#filterByBudget(context, req.allocation.context)
      : context;
    const filteredHistory = req.allocation
      ? this.#filterByBudget(history, req.allocation.history)
      : history;

    if (req.allocation) {
      this.debug("Memory window allocation", {
        tools: req.allocation.tools,
        context: req.allocation.context,
        history: req.allocation.history,
      });
    }

    this.debug("Memory window lengths", {
      tools: filteredTools.length,
      context: filteredContext.length,
      history: filteredHistory.length,
    });

    return {
      for: req.for,
      tools: filteredTools,
      context: filteredContext,
      history: filteredHistory,
    };
  }

  /**
   * Loads memory context for a given resource
   * @param {string} forResource - Resource identifier
   * @returns {Promise<Array>} Deduplicated context identifiers
   * @private
   */
  async #loadMemoryContext(forResource) {
    let context = [];
    const key = `${forResource}.jsonl`;

    // Wait for lock to be released if another append is in progress
    while (this.#lock[forResource]) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      // Storage automatically parses .jsonl files into arrays
      context = await this.#storage.get(key);
      if (!Array.isArray(context)) {
        context = [];
      }
    } catch {
      // No memory found, return empty context
      this.debug("No memory found", { for: forResource });
    }

    // De-duplicate by identifier
    const seen = new Set();
    return context.filter((identifier) => {
      if (identifier.name && !seen.has(identifier.name)) {
        seen.add(identifier.name);
        return true;
      }
      return false;
    });
  }

  /**
   * Loads tools for the memory window including always-loaded tools
   * @param {Array} context - Context identifiers
   * @returns {Promise<Array>} Tool identifiers
   * @private
   */
  async #loadToolsForWindow(context) {
    // Filter out tools from context
    let tools = context.filter((identifier) =>
      identifier.type?.startsWith("common.Tool"),
    );

    // Load always-loaded tools from configuration
    const alwaysLoadTools = this.config.alwaysLoadTools || [];
    if (alwaysLoadTools.length > 0) {
      this.debug("Loading always-load tools", {
        tools: alwaysLoadTools,
      });

      // Find tool identifiers by name using prefix search
      for (const toolName of alwaysLoadTools) {
        const toolPrefix = `common.ToolFunction.${toolName}`;
        const foundTools = await this.#resourceIndex.findByPrefix(toolPrefix);

        // Add tools that aren't already in the context
        for (const toolIdentifier of foundTools) {
          if (!tools.some((t) => t.name === toolIdentifier.name)) {
            tools.push(toolIdentifier);
          }
        }
      }
    }

    return tools;
  }

  /**
   * Loads history for the memory window
   * @param {string} forResource - Resource identifier
   * @returns {Promise<Array>} History message identifiers
   * @private
   */
  async #loadHistoryForWindow(forResource) {
    // Load all messages under the given resource using prefix search
    const identifiers = await this.#resourceIndex.findByPrefix(forResource);

    this.debug("Identifiers by prefix", {
      for: forResource,
      count: identifiers.length,
    });

    // Extract message identifiers
    return identifiers.filter((identifier) =>
      identifier.type?.startsWith("common.Message"),
    );
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

// Export the service class (no bootstrap code here)
