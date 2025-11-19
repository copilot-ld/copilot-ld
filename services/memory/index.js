/* eslint-env node */
import { services } from "@copilot-ld/librpc";
import { MemoryWindow } from "@copilot-ld/libmemory";
import { MemoryIndex } from "@copilot-ld/libmemory/index/memory.js";

const { MemoryBase } = services;

/**
 * Memory service for managing transient resources and memory windows
 */
export class MemoryService extends MemoryBase {
  #storage;
  #windows = new Map();
  #lock = {};

  /**
   * Creates a new Memory service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage instance for memories
   */
  constructor(config, storage) {
    super(config);
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
  async AppendMemory(req) {
    if (!req.resource_id) throw new Error("resource_id is required");

    this.#lock[req.resource_id] = true;

    try {
      const window = this.#getWindow(req.resource_id);

      if (req.identifiers && req.identifiers.length > 0) {
        await window.append(req.identifiers);
      }
    } finally {
      delete this.#lock[req.resource_id];
    }

    return { accepted: req.resource_id };
  }

  /** @inheritdoc */
  async GetWindow(req) {
    if (!req.resource_id) throw new Error("resource_id is required");

    if (
      !req.budget ||
      !req.allocation?.tools ||
      !req.allocation?.context ||
      !req.allocation?.conversation
    ) {
      throw new Error(
        "Budget allocation is required: tools, context, conversation",
      );
    }

    while (this.#lock[req.resource_id]) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const window = this.#getWindow(req.resource_id);
    const memory = await window.build(req.budget, req.allocation);

    return {
      resource_id: req.resource_id,
      tools: memory.tools,
      context: memory.context,
      conversation: memory.conversation,
    };
  }
}
