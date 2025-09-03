/* eslint-env node */
import { MemoryBase } from "./service.js";

/**
 * Memory service for managing transient resources and memory windows
 */
export class MemoryService extends MemoryBase {
  #storage;
  #resourceIndex;

  /**
   * Creates a new Memory service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage instance for memories
   * @param {import("@copilot-ld/libresource").ResourceIndexInterface} resourceIndex - ResourceIndex instance for accessing resources
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, storage, resourceIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    if (!storage) throw new Error("storage is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#storage = storage;
    this.#resourceIndex = resourceIndex;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").memory.AppendRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").memory.AppendResponse>} Response message
   */
  async Append(req) {
    if (!req.for) throw new Error("for is required");

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

    return { accepted: req.for };
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").memory.WindowRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").memory.Window>} Response message
   */
  async GetWindow(req) {
    if (!req.for) throw new Error("for is required");

    this.debug("Getting memory window", {
      for: req.for,
      dimensions: req.vector?.length || 0,
      budget: req.budget || "unlimited",
    });

    // TODO: Implement tools
    let tools = [];

    // Load context from memory using JSONL format
    let context = [];
    const key = `${req.for}.jsonl`;

    try {
      // Storage automatically parses .jsonl files into arrays
      context = await this.#storage.get(key);
      if (!Array.isArray(context)) {
        context = [];
      }
    } catch {
      // No memory found, return empty context
      this.debug("No memory found", { for: req.for });
    }

    // Load all messages under the given resource using prefix search
    const identifiers = await this.#resourceIndex.findByPrefix(req.for);

    this.debug("Identifiers by prefix", {
      for: req.for,
      count: identifiers.length,
    });

    // Extract message identifiers
    let history = identifiers.filter((identifier) =>
      identifier.type?.includes("MessageV2"),
    );

    // Apply budget filtering if allocation is provided
    if (req.allocation) {
      tools = this.#filterByBudget(tools, req.allocation.tools);
      context = this.#filterByBudget(context, req.allocation.context);
      history = this.#filterByBudget(history, req.allocation.history);

      this.debug("Memory window allocation", {
        tools: req.allocation.tools,
        context: req.allocation.context,
        history: req.allocation.history,
      });
    }

    this.debug("Memory window lengths", {
      tools: tools.length,
      context: context.length,
      history: history.length,
    });

    return {
      for: req.for,
      tools,
      context,
      history,
    };
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

export { MemoryClient } from "./client.js";
