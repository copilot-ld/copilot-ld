/* eslint-env node */

/**
 * Base interface for policy engine implementations
 */
export class PolicyInterface {
  /**
   * Initialize policy engine and load policies from storage
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async load() {
    throw new Error("Not implemented");
  }

  /**
   * Evaluate policy for given input parameters
   * @param {object} input - Policy evaluation input
   * @param {string} input.actor - Actor identifier (URI format)
   * @param {string[]} input.resources - Array of resource identifiers (URI format)
   * @returns {Promise<boolean>} True if access is allowed, false otherwise
   * @throws {Error} Not implemented
   */
  async evaluate(input) {
    throw new Error("Not implemented");
  }
}
