/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { queryIndices } from "@copilot-ld/libvector";

import { VectorServiceInterface } from "./types.js";

/**
 * Vector search service for querying multiple indices
 * @implements {VectorServiceInterface}
 */
class VectorService extends Service {
  #vectorIndices;

  /**
   * Creates a new Vector service instance
   * @param {object} config - Service configuration object
   * @param {Map<string, object>} vectorIndices - Pre-initialized vector indices
   */
  constructor(config, vectorIndices) {
    super(config, vectorIndices);
    this.#vectorIndices = vectorIndices;
  }

  /**
   * Queries multiple vector indices and returns consolidated results
   * @param {object} params - Request parameters
   * @param {string[]} params.indices - Array of index names to query
   * @param {number[]} params.vector - The query vector
   * @param {number} params.threshold - Minimum similarity threshold
   * @param {number} params.limit - Maximum number of results
   * @returns {Promise<object>} Object containing results array
   */
  async QueryItems({ indices, vector, threshold, limit }) {
    const requestedIndices = indices
      .map((name) => this.#vectorIndices.get(name))
      .filter((index) => index);

    const results = await queryIndices(
      requestedIndices,
      vector,
      threshold,
      limit,
    );

    return { results };
  }
}

export { VectorService, VectorServiceInterface };
