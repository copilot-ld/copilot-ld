/* eslint-env node */

import { resource } from "@copilot-ld/libtype";


/** @typedef {import("@copilot-ld/libconfig").ConfigInterface} ConfigInterface */

/**
 * VectorIndex class for managing vector data with lazy loading
 */
export class VectorIndex {
  #storage;
  #indexKey;
  #index = new Map(); // Map of resource id to index item
  #loaded = false;

  /**
   * TODO: Add documentation
   * @param storage
   * @param indexKey
   */
  constructor(storage, indexKey = "index.jsonl") {

    this.#storage = storage;
    this.#indexKey = indexKey;
  }

  /** TODO: Add documentation */
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
   * TODO: Add documentation
   * @param vector
   * @param identifier
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
   * TODO: Add documentation
   * @param id
   */
  async getItem(id) {
    if (!this.#loaded) await this.loadData();
    const item = this.#index.get(id);
    return item ? item.identifier : null;
  }

  /**
   * TODO: Add documentation
   * @param id
   */
  async hasItem(id) {
    if (!this.#loaded) await this.loadData();
    return this.#index.has(id);
  }

  /** TODO: Add documentation */
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
   * TODO: Add documentation
   * @param query
   * @param filter
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
