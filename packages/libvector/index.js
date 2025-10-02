/* eslint-env node */

import { resource } from "@copilot-ld/libtype";

/**
 * VectorIndex class for managing vector data with lazy loading
 */
export class VectorIndex {
  #storage;
  #indexKey;
  #index = new Map(); // Map of resource id to index item
  #loaded = false;

  /**
   * Creates a new VectorIndex instance
   * @param {import("@copilot-ld/libstorage").LocalStorage|import("@copilot-ld/libstorage").S3Storage} storage - Storage interface for data operations
   * @param {string} [indexKey] - The index file name to use for storage (default: "index.jsonl")
   */
  constructor(storage, indexKey = "index.jsonl") {
    this.#storage = storage;
    this.#indexKey = indexKey;
  }

  /**
   * Gets the storage instance
   * @returns {import("@copilot-ld/libstorage").LocalStorage|import("@copilot-ld/libstorage").S3Storage} Storage instance
   */
  storage() {
    return this.#storage;
  }

  /**
   * Gets the index key (filename)
   * @returns {string} The index key
   */
  get indexKey() {
    return this.#indexKey;
  }

  /**
   * Adds a vector item to the index
   * @param {number[]} vector - The vector
   * @param {resource.Identifier} identifier - Resource identifier
   * @returns {Promise<void>}
   */
  async addItem(vector, identifier) {
    if (!this.#loaded) await this.loadData();

    const item = {
      uri: String(identifier),
      identifier,
      vector,
    };

    // Store item in the map using URI as key
    this.#index.set(item.uri, item);

    // Append item to storage as JSON-ND line
    await this.#storage.append(this.#indexKey, JSON.stringify(item));
  }

  /**
   * Gets an item by its resource ID
   * @param {string} id - The resource ID to retrieve
   * @returns {Promise<resource.Identifier|null>} The item identifier, or null if not found
   */
  async getItem(id) {
    if (!this.#loaded) await this.loadData();
    const item = this.#index.get(id);
    return item ? item.identifier : null;
  }

  /**
   * Checks if an item with the given ID exists in the index
   * @param {string} id - The ID to check for
   * @returns {Promise<boolean>} True if item exists, false otherwise
   */
  async hasItem(id) {
    if (!this.#loaded) await this.loadData();
    return this.#index.has(id);
  }

  /**
   * Loads vector data from disk
   * @returns {Promise<void>}
   */
  async loadData() {
    if (!(await this.#storage.exists(this.#indexKey))) {
      // Initialize empty index for new systems
      this.#index.clear();
      this.#loaded = true;
      return;
    }

    // Storage automatically parses .jsonl files into arrays
    const items = await this.#storage.get(this.#indexKey);
    const parsedItems = Array.isArray(items) ? items : [];

    // Populate the index map with URI as key
    this.#index.clear();
    for (const item of parsedItems) {
      this.#index.set(item.uri, item);
    }

    this.#loaded = true;
  }

  /**
   * Queries items from this vector index using cosine similarity
   * @param {number[]} query - Query vector
   * @param {object} filter - Filter object for query constraints
   * @param {number} [filter.limit] - Maximum number of results to return
   * @param {number} [filter.threshold] - Minimum score threshold
   * @param {number} [filter.max_tokens] - Maximum total tokens allowed in results
   * @param {string} [filter.prefix] - URI prefix filter
   * @returns {Promise<resource.Identifier[]>} Array of resource identifiers sorted by score
   */
  async queryItems(query, filter = {}) {
    if (!this.#loaded) await this.loadData();

    const { threshold = 0, limit = 0, prefix } = filter;
    const identifiers = [];

    for (const item of this.#index.values()) {
      if (prefix && !item.uri.startsWith(prefix)) continue;
      const score = calculateDotProduct(query, item.vector, query.length);
      if (score >= threshold) {
        item.identifier.score = score;
        identifiers.push(resource.Identifier.fromObject(item.identifier));
      }
    }

    identifiers.sort((a, b) => b.score - a.score);
    if (limit > 0) {
      return identifiers.slice(0, limit);
    }
    return identifiers;
  }
}

/**
 * Dot product calculation with loop unrolling
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @param {number} length - Length of vectors
 * @returns {number} The dot product of the two vectors
 */
function calculateDotProduct(a, b, length) {
  let dotProduct = 0;
  let i = 0;

  for (; i < length - 7; i += 8) {
    dotProduct +=
      a[i] * b[i] +
      a[i + 1] * b[i + 1] +
      a[i + 2] * b[i + 2] +
      a[i + 3] * b[i + 3] +
      a[i + 4] * b[i + 4] +
      a[i + 5] * b[i + 5] +
      a[i + 6] * b[i + 6] +
      a[i + 7] * b[i + 7];
  }

  for (; i < length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}

export { VectorProcessor } from "./processor.js";
