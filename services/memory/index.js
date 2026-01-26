import { services } from "@copilot-ld/librpc";
import { MemoryWindow } from "@copilot-ld/libmemory";
import { MemoryIndex } from "@copilot-ld/libmemory/index/memory.js";

const { MemoryBase } = services;

/**
 * Memory service for managing transient resources and memory windows
 */
export class MemoryService extends MemoryBase {
  #storage;
  #resourceIndex;
  #indices = new Map();
  #lockPromises = new Map();

  /**
   * Creates a new Memory service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage instance for memories
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for loading resources
   */
  constructor(config, storage, resourceIndex) {
    super(config);
    if (!storage) throw new Error("storage is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#storage = storage;
    this.#resourceIndex = resourceIndex;
  }

  /**
   * Gets (and creates if necessary) the MemoryIndex for a specific resource
   * @param {string} id - Resource ID
   * @returns {MemoryIndex} MemoryIndex instance for the resource
   * @private
   */
  #getMemoryIndex(id) {
    if (!this.#indices.has(id)) {
      const key = `${id}.jsonl`;
      const index = new MemoryIndex(this.#storage, key);
      this.#indices.set(id, index);
    }
    return this.#indices.get(id);
  }

  /**
   * Acquires the lock for a resource and returns a release function.
   * This implements a proper async mutex that chains operations sequentially.
   * @param {string} resourceId - Resource ID to lock
   * @returns {Promise<() => void>} Function to release the lock
   * @private
   */
  async #acquireLock(resourceId) {
    // Get the current lock promise (or resolved promise if none)
    const currentLock = this.#lockPromises.get(resourceId) || Promise.resolve();

    // Create our lock promise that will resolve when we release
    let releaseLock;
    const ourLock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    // Chain our lock after the current one - this is the key:
    // We set the new promise BEFORE awaiting, so the next request
    // will wait for OUR lock, not the previous one
    this.#lockPromises.set(resourceId, ourLock);

    // Wait for the previous operation to complete
    await currentLock;

    // Return the release function
    return releaseLock;
  }

  /** @inheritdoc */
  async AppendMemory(req) {
    if (!req.resource_id) throw new Error("resource_id is required");

    const releaseLock = await this.#acquireLock(req.resource_id);

    try {
      const memoryIndex = this.#getMemoryIndex(req.resource_id);
      const window = new MemoryWindow(
        req.resource_id,
        this.#resourceIndex,
        memoryIndex,
      );

      if (req.identifiers && req.identifiers.length > 0) {
        await window.append(req.identifiers);
      }
    } finally {
      releaseLock();
    }

    return { accepted: req.resource_id };
  }

  /** @inheritdoc */
  async GetWindow(req) {
    if (!req.resource_id) throw new Error("resource_id is required");
    if (!req.model) throw new Error("model is required");

    // Wait for any pending writes to complete before reading
    const releaseLock = await this.#acquireLock(req.resource_id);

    try {
      const memoryIndex = this.#getMemoryIndex(req.resource_id);
      const window = new MemoryWindow(
        req.resource_id,
        this.#resourceIndex,
        memoryIndex,
      );
      const { messages, tools } = await window.build(req.model);

      return { messages, tools };
    } finally {
      releaseLock();
    }
  }

  /** @inheritdoc */
  async GetBudget(req) {
    if (!req.resource_id) throw new Error("resource_id is required");
    if (!req.model) throw new Error("model is required");

    const memoryIndex = this.#getMemoryIndex(req.resource_id);
    const window = new MemoryWindow(
      req.resource_id,
      this.#resourceIndex,
      memoryIndex,
    );

    return await window.calculateBudget(req.model);
  }
}
