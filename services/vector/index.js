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
  #queryIndicesFn;

  /**
   * Creates a new Vector service instance
   * @param {object} config - Service configuration object
   * @param {Map<string, object>} vectorIndices - Pre-initialized vector indices
   * @param {Function} [grpcFn] - Optional gRPC factory function
   * @param {Function} [authFn] - Optional auth factory function
   * @param {Function} [logFn] - Optional log factory function
   * @param {Function} [queryIndicesFn] - Optional queryIndices function
   */
  constructor(
    config,
    vectorIndices,
    grpcFn,
    authFn,
    logFn,
    queryIndicesFn = queryIndices,
  ) {
    super(config, grpcFn, authFn, logFn);
    this.#vectorIndices = vectorIndices;
    this.#queryIndicesFn = queryIndicesFn;
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
   */
  async QueryItems({ indices, vector, threshold, limit, max_tokens }) {
    this.debug("Querying vector indices", {
      indices: indices.join(","),
      threshold,
      limit,
      max_tokens: max_tokens || "unlimited",
    });

    const requestedIndices = indices
      .map((name) => this.#vectorIndices.get(name))
      .filter((index) => index);

    const results = await this.#queryIndicesFn(
      requestedIndices,
      vector,
      threshold,
      limit,
    );

    // If no token limit specified, return all results
    if (max_tokens === undefined || max_tokens === null) {
      this.debug("Returning results", {
        count: results.length,
        tokens: "unlimited",
      });
      return { results };
    }

    // Filter results by token count, keeping highest scored items
    // Results from queryIndices are already sorted by score (highest first)
    const filteredResults = [];
    let totalTokens = 0;

    for (const result of results) {
      const resultTokens = result.tokens || 0;
      if (totalTokens + resultTokens <= max_tokens) {
        filteredResults.push(result);
        totalTokens += resultTokens;
      } else {
        break; // Stop when we would exceed token limit
      }
    }

    this.debug("Filtered results", {
      filtered: `${filteredResults.length}/${results.length}`,
      tokens: `${totalTokens}/${max_tokens}`,
    });
    return { results: filteredResults };
  }
}

export { VectorService, VectorServiceInterface };
