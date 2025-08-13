/* eslint-env node */
import * as libchunk from "@copilot-ld/libchunk";
import * as libconfig from "@copilot-ld/libconfig";
import * as libservice from "@copilot-ld/libservice";

/**
 * Base interface for Text service
 * @implements {libservice.ServiceInterface}
 */
export class TextServiceInterface extends libservice.ServiceInterface {
  /**
   * Creates a new Text service instance
   * @param {libconfig.ServiceConfigInterface} config - Service configuration object
   * @param {libchunk.ChunkIndexInterface} chunkIndex - Pre-initialized chunk index
   * @param {Function} [grpcFn] - Optional gRPC factory function
   * @param {Function} [authFn] - Optional auth factory function
   * @param {Function} [logFn] - Optional log factory function
   * @throws {Error} Not implemented
   */
  constructor(config, chunkIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
  }

  /**
   * Retrieves text chunks by their IDs
   * @param {object} params - Request parameters
   * @param {string[]} params.ids - Array of chunk IDs to retrieve
   * @returns {Promise<object>} Object containing chunks keyed by ID
   * @throws {Error} Not implemented
   */
  async GetChunks({ ids }) {
    throw new Error("Not implemented");
  }
}
