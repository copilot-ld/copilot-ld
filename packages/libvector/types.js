/* eslint-env node */
import * as libtype from "@copilot-ld/libtype";

/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

/**
 * Base interface for vector index management
 */
export class VectorIndexInterface {
  /**
   * Creates a new VectorIndex instance
   * @param {StorageInterface} storage - Storage interface for data operations
   * @throws {Error} Not implemented
   */
  constructor(storage) {}

  /**
   * Adds a vector item to the index
   * @param {string} id - Unique identifier for the vector
   * @param {number[]} vector - The vector data
   * @param {number} tokens - Number of tokens (optional, defaults to 0)
   * @param {string} scope - Scope classification (optional, defaults to null)
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async addItem(id, vector, tokens = 0, scope = null) {
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
   * Gets the index file path
   * @throws {Error} Not implemented
   */
  getIndexPath() {
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
   * @param {number} threshold - Minimum score threshold (default: 0)
   * @param {number} limit - Maximum number of results to return (default: 0 = all results)
   * @returns {Promise<libtype.Similarity[]>} Array of Similarity instances sorted by score
   * @throws {Error} Not implemented
   */
  async queryItems(query, threshold = 0, limit = 0) {
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
