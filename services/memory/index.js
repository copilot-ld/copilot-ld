/* eslint-env node */
import { services } from "@copilot-ld/librpc";
import { MemoryWindow, MemoryIndex } from "@copilot-ld/libmemory";

const { MemoryBase } = services;

/**
 * Memory service for managing transient resources and memory windows
 */
export class MemoryService extends MemoryBase {
  #storage;
  #windows = new Map(); // Cache of MemoryWindow instances per resource
  #lock = {}; // Lock mechanism for network-level request coordination

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

  /**
   * Gets (and creates if necessary) the MemoryWindow for a specific resource
   * @param {string} id - Resource ID
   * @returns {MemoryWindow} MemoryWindow instance for the resource
   * @private
   */
  #getWindow(id) {
    if (!this.#windows.has(id)) {
      const key = `${id}.jsonl`;
      const index = new MemoryIndex(this.#storage, key);
      const window = new MemoryWindow(index);
      this.#windows.set(id, window);
    }
    return this.#windows.get(id);
  }

  /** @inheritdoc */
  async Append(req) {
    if (!req.for) throw new Error("for is required");

    // Acquire a lock in case clients append memory as a fire-and-forget call and
    // immediately want to read back the window
    this.#lock[req.for] = true;

    try {
      this.debug("Appending memory", {
        for: req.for,
        count: req.identifiers?.length || 0,
      });

      // Get the MemoryWindow for this resource
      const window = this.#getWindow(req.for);

      // Use MemoryWindow to append identifiers
      if (req.identifiers && req.identifiers.length > 0) {
        await window.append(req.identifiers);
      }
    } finally {
      delete this.#lock[req.for];
    }

    return { accepted: req.for };
  }

  /** @inheritdoc */
  async Get(req) {
    if (!req.for) throw new Error("for is required");

    if (!req.budget || !req.allocation?.tools || !req.allocation?.history) {
      throw new Error("Budget allocation of tools and history is required");
    }

    // Wait for lock to be released if another append is in progress
    while (this.#lock[req.for]) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.debug("Getting memory window", {
      for: req.for,
      budget: req.budget,
      allocationTools: req.allocation?.tools,
      allocationHistory: req.allocation?.history,
    });

    const window = this.#getWindow(req.for);
    const memory = await window.build(req.budget, req.allocation);

    this.debug("Memory window contents", {
      tools: memory.tools.length,
      history: memory.history.length,
    });

    return {
      for: req.for,
      tools: memory.tools,
      history: memory.history,
    };
  }
}
