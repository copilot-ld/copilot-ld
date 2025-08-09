/* eslint-env node */
import { Service } from "@copilot-ld/libservice";

import { TextServiceInterface } from "./types.js";

/**
 * Text chunk retrieval service
 * @implements {TextServiceInterface}
 */
class TextService extends Service {
  #chunkIndex;

  /**
   * Creates a new Text service instance
   * @param {object} config - Service configuration object
   * @param {object} chunkIndex - ChunkIndex instance for data access
   */
  constructor(config, chunkIndex) {
    super(config);
    this.#chunkIndex = chunkIndex;
  }

  /**
   * Retrieves chunks by their IDs
   * @param {object} request - Request object containing chunk IDs
   * @param {string[]} request.ids - Array of chunk IDs to retrieve
   * @returns {Promise<object>} Response containing the requested chunks
   */
  async GetChunks({ ids }) {
    const chunks = await this.#chunkIndex.getChunks(ids);
    return { chunks };
  }
}

export { TextService, TextServiceInterface };
