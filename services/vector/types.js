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
   * @param {object} vectorIndex - Pre-initialized vector index
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   * @throws {Error} Not implemented
   */
  constructor(config, vectorIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
  }

  /**
   * Queries the vector index and returns results
   * @param {object} params - Request parameters
   * @param {number[]} params.vector - The query vector
   * @param {number} params.threshold - Minimum similarity threshold
   * @param {number} params.limit - Maximum number of results
   * @param {number} [params.max_tokens] - Maximum tokens to return in results
   * @returns {Promise<object>} Object containing results array
   * @throws {Error} Not implemented
   */
  async QueryItems({ vector, threshold, limit, max_tokens }) {
    throw new Error("Not implemented");
  }
}
