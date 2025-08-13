/* eslint-env node */
import * as libconfig from "@copilot-ld/libconfig";
import * as libservice from "@copilot-ld/libservice";

/**
 * Base interface for Vector service
 * @implements {libservice.ServiceInterface}
 */
export class VectorServiceInterface extends libservice.ServiceInterface {
  /**
   * Creates a new Vector service instance
   * @param {libconfig.ServiceConfigInterface} config - Service configuration object
   * @param {Map} vectorIndices - Pre-initialized vector indices
   * @param {Function} [grpcFn] - Optional gRPC factory function
   * @param {Function} [authFn] - Optional auth factory function
   * @param {Function} [logFn] - Optional log factory function
   * @throws {Error} Not implemented
   */
  constructor(config, vectorIndices, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
  }

  /**
   * Queries multiple vector indices and returns consolidated results
   * @param {object} params - Request parameters
   * @param {string[]} params.indices - Array of index names to query
   * @param {number[]} params.vector - The query vector
   * @param {number} params.threshold - Minimum similarity threshold
   * @param {number} params.limit - Maximum number of results
   * @param {number} [params.max_tokens] - Maximum tokens to return in results
   * @returns {Promise<object>} Object containing results array
   * @throws {Error} Not implemented
   */
  async QueryItems({ indices, vector, threshold, limit, max_tokens }) {
    throw new Error("Not implemented");
  }
}
