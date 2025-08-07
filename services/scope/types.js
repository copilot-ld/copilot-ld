/* eslint-env node */
import * as libconfig from "@copilot-ld/libconfig";
import * as libservice from "@copilot-ld/libservice";

/**
 * Base interface for Scope service
 * @implements {libservice.ServiceInterface}
 */
export class ScopeServiceInterface {
  /**
   * Creates a new Scope service instance
   * @param {libconfig.ServiceConfigInterface} config - Service configuration object
   * @param {object} scopeIndex - Pre-initialized scope index
   * @throws {Error} Not implemented
   */
  constructor(config, scopeIndex) {}

  /**
   * Resolves scope based on vector query
   * @param {object} params - Request parameters
   * @param {number[]} params.vector - The query vector
   * @returns {Promise<object>} Object containing resolved scope indices
   * @throws {Error} Not implemented
   */
  async ResolveScope({ vector }) {
    throw new Error("Not implemented");
  }
}
