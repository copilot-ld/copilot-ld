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
   * Retrieve all resources with access control and policy filtering
   * @param {string} actor - Actor ID requesting access (URI format)
   * @returns {Promise<object[]>} Array of typed resource objects that pass policy evaluation
   * @throws {Error} Not implemented
   */
  async getAll(actor) {
    throw new Error("Not implemented");
  }
}

/**
 * Base interface for resource processor implementations
 */
export class ResourceProcessorInterface {
  /**
   * Processes HTML files from a knowledge base
   * @param {string} extension - File extension to search for (default: ".html")
   * @param {string[]} selectors - Array of CSS selectors to filter microdata items (default: [])
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async processKnowledge(extension = ".html", selectors = []) {
    throw new Error("Not implemented");
  }
}
