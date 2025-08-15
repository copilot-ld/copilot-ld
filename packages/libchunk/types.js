/* eslint-env node */
import * as libtype from "@copilot-ld/libtype";

/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

/**
 * Base interface for chunk index management
 */
export class ChunkIndexInterface {
  /**
   * Creates a new ChunkIndex instance
   * @param {StorageInterface} storage - Storage interface for data operations
   * @throws {Error} Not implemented
   */
  constructor(storage) {}

  /**
   * Adds a chunk to the in-memory index
   * @param {libtype.Chunk | object} data - Data with id, tokens
   * @returns {void}
   * @throws {Error} Not implemented
   */
  addChunk(data) {
    throw new Error("Not implemented");
  }

  /**
   * Gets all chunks with content and metadata
   * @returns {Promise<object>} Object with chunk ids as keys and Chunk instances as values
   * @throws {Error} Not implemented
   */
  async getAllChunks() {
    throw new Error("Not implemented");
  }

  /**
   * Gets chunk content by ids, auto-loading data if needed
   * @param {string[]} ids - Array of chunk ids to retrieve
   * @returns {Promise<object>} Object with chunk ids as keys and Chunk instances as values
   * @throws {Error} Not implemented
   */
  async getChunks(ids) {
    throw new Error("Not implemented");
  }

  /**
   * Loads chunk data from disk
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async loadData() {
    throw new Error("Not implemented");
  }

  /**
   * Persists the current index to disk
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async persist() {
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
