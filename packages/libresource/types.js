/* eslint-env node */

/**
 * Base interface for resource index implementations
 */
export class ResourceIndexInterface {
  /**
   * Store a resource with metadata generation
   * @param {object} resource - Typed resource object
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async put(resource) {
    throw new Error("Not implemented");
  }

  /**
   * Retrieve resources by their IDs with access control
   * @param {string} actor - Actor ID requesting access (URI format)
   * @param {string[]} ids - Resource IDs to retrieve (URI format)
   * @returns {Promise<object[]>} Array of typed resource objects
   * @throws {Error} Not implemented
   */
  async get(actor, ids) {
    throw new Error("Not implemented");
  }

  /**
   * Find all resource identifiers
   * @returns {Promise<object[]>} Array of resource Identifier objects
   * @throws {Error} Not implemented
   */
  async findAll() {
    throw new Error("Not implemented");
  }

  /**
   * Find resource identifiers by URI prefix
   * @param {string} prefix - URI prefix to search for (e.g., "cld:common.Conversation.hash0001")
   * @returns {Promise<object[]>} Array of resource Identifier objects matching the prefix
   * @throws {Error} Not implemented
   */
  async findByPrefix(prefix) {
    throw new Error("Not implemented");
  }
}
