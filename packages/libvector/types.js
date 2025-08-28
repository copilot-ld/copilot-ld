/* eslint-env node */
import { common, resource } from "@copilot-ld/libtype";

/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */
/** @typedef {import("@copilot-ld/libtype").resource.Descriptor} resource.Descriptor */
/** @typedef {import("@copilot-ld/libtype").common.Similarity} common.Similarity */

/**
 * Base interface for vector index management
 */
export class VectorIndexInterface {
  /**
   * Creates a new VectorIndex instance
   * @param {StorageInterface} storage - Storage interface for data operations
   * @param {string} [indexKey] - The index file name to use for storage (default: "index.jsonl")
   * @throws {Error} Not implemented
   */
  constructor(storage, indexKey = "index.jsonl") {}

  /**
   * Adds a vector item to the index
   * @param {number[]} vector - The vector
   * @param {resource.Identifier} identifier - Resource identifier
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async addItem(vector, identifier) {
    throw new Error("Not implemented");
  }

  /**
   * Checks if an item with the given ID exists in the index
   * @param {string} id - The ID to check for
   * @returns {Promise<boolean>} True if item exists, false otherwise
   * @throws {Error} Not implemented
   */
  async hasItem(id) {
    throw new Error("Not implemented");
  }

  /**
   * Loads vector data from disk
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async loadData() {
    throw new Error("Not implemented");
  }

  /**
   * Persists the vector index to disk
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async persist() {
    throw new Error("Not implemented");
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
   * @throws {Error} Not implemented
   */
  async queryItems(query, filter = {}) {
    throw new Error("Not implemented");
  }

  /**
   * Gets the storage instance
   * @throws {Error} Not implemented
   */
  storage() {
    throw new Error("Not implemented");
  }
}
