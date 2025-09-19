/* eslint-env node */

/**
 * Base interface for storage implementations
 */
export class StorageInterface {
  /**
   * Store data with the given key
   * @param {string} key - Storage key identifier
   * @param {string|Buffer} data - Data to store
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async put(key, data) {
    throw new Error("Not implemented");
  }

  /**
   * Append data to an existing key with automatic newline
   * @param {string} key - Storage key identifier
   * @param {string|Buffer} data - Data to append (newline will be added automatically)
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async append(key, data) {
    throw new Error("Not implemented");
  }

  /**
   * Retrieve data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<string|Buffer|object[]|object>} Retrieved data (returns parsed JSON array for .jsonl files, parsed JSON object for .json files)
   * @throws {Error} Not implemented
   */
  async get(key) {
    throw new Error("Not implemented");
  }

  /**
   * Remove data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async delete(key) {
    throw new Error("Not implemented");
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key identifier
   * @returns {Promise<boolean>} True if key exists, false otherwise
   * @throws {Error} Not implemented
   */
  async exists(key) {
    throw new Error("Not implemented");
  }

  /**
   * Recursively find keys with specified extension
   * @param {string} extension - File extension to search for (e.g., ".json", ".html")
   * @returns {Promise<string[]>} Array of keys with the specified extension, sorted by creation timestamp (oldest first)
   * @throws {Error} Not implemented
   */
  async findByExtension(extension) {
    throw new Error("Not implemented");
  }

  /**
   * Retrieve multiple items by their keys
   * @param {string[]} keys - Array of storage key identifiers
   * @returns {Promise<{[key: string]: string|Buffer}>} Object with key-value pairs where keys are storage keys and values are the retrieved data
   * @throws {Error} Not implemented
   */
  async getMany(keys) {
    throw new Error("Not implemented");
  }

  /**
   * Find keys with specified prefix for URI-based lookups
   * @param {string} prefix - Key prefix to search for (e.g., "cld:common.Conversation.hash0001/common.MessageV2.hash0002")
   * @returns {Promise<string[]>} Array of keys with the specified prefix, sorted by creation timestamp (oldest first)
   * @throws {Error} Not implemented
   */
  async findByPrefix(prefix) {
    throw new Error("Not implemented");
  }

  /**
   * List all keys in the storage
   * @returns {Promise<string[]>} Array of all storage keys, sorted by creation timestamp (oldest first)
   * @throws {Error} Not implemented
   */
  async list() {
    throw new Error("Not implemented");
  }

  /**
   * Get full path by combining base path and relative key
   * @param {string} key - Relative key identifier
   * @throws {Error} Not implemented
   */
  path(key) {
    throw new Error("Not implemented");
  }

  /**
   * Ensure the storage bucket exists
   * @returns {Promise<boolean>} True if bucket was created, false if already existed
   * @throws {Error} Not implemented
   */
  async ensureBucket() {
    throw new Error("Not implemented");
  }

  /**
   * Check if the storage bucket exists
   * @returns {Promise<boolean>} True if bucket exists, false otherwise
   * @throws {Error} Not implemented
   */
  async bucketExists() {
    throw new Error("Not implemented");
  }
}
