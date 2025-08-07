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
   * Retrieve data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<string|Buffer>} Retrieved data
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
   * @returns {Promise<string[]>} Array of keys with the specified extension
   * @throws {Error} Not implemented
   */
  async find(extension) {
    throw new Error("Not implemented");
  }
}
