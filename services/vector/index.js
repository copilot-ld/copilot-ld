/* eslint-env node */
import { VectorBase } from "./types.js";

/**
 * Vector search service for querying a single vector index
 */
class VectorService extends VectorBase {
  #vectorIndex;

  /**
   * Creates a new Vector service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} vectorIndex - Pre-initialized vector index
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, vectorIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    this.#vectorIndex = vectorIndex;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").vector.QueryItemsRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").vector.QueryItemsResponse>} Response message
   */
  async QueryItems(req) {
    this.debug("Querying vector index", {
      threshold: req.threshold,
      limit: req.limit,
      max_tokens: req.max_tokens || "unlimited",
    });

    const results = await this.#vectorIndex.queryItems(
      req.vector,
      req.threshold,
      req.limit,
    );

    // If no token limit specified, return all results
    if (req.max_tokens === undefined || req.max_tokens === null) {
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
      if (totalTokens + resultTokens <= req.max_tokens) {
        filteredResults.push(result);
        totalTokens += resultTokens;
      } else {
        break; // Stop when we would exceed token limit
      }
    }

    this.debug("Filtered results", {
      filtered: `${filteredResults.length}/${results.length}`,
      tokens: `${totalTokens}/${req.max_tokens}`,
    });
    return { results: filteredResults };
  }
}

export { VectorService };
