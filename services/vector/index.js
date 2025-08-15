/* eslint-env node */
import { Service } from "@copilot-ld/libservice";

import { VectorServiceInterface } from "./types.js";

/**
 * Vector search service for querying a single vector index
 * @implements {VectorServiceInterface}
 */
class VectorService extends Service {
  #vectorIndex;

  /**
   * Creates a new Vector service instance
   * @param {object} config - Service configuration object
   * @param {object} vectorIndex - Pre-initialized vector index
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, vectorIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    this.#vectorIndex = vectorIndex;
  }

  /**
   * Queries the vector index and returns results
   * @param {object} params - Request parameters
   * @param {number[]} params.vector - The query vector
   * @param {number} params.threshold - Minimum similarity threshold
   * @param {number} params.limit - Maximum number of results
   * @param {number} [params.max_tokens] - Maximum tokens to return in results
   * @returns {Promise<object>} Object containing results array
   */
  async QueryItems({ vector, threshold, limit, max_tokens }) {
    this.debug("Querying vector index", {
      threshold,
      limit,
      max_tokens: max_tokens || "unlimited",
    });

    const results = await this.#vectorIndex.queryItems(
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
    // Results from queryItems are already sorted by score (highest first)
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
