/* eslint-env node */
import { VectorBase } from "./types.js";

/**
 * Vector search service for querying content and descriptor vector indexes
 */
class VectorService extends VectorBase {
  #contentIndex;
  #descriptorIndex;

  /**
   * Creates a new Vector service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} contentIndex - Pre-initialized content vector index
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} descriptorIndex - Pre-initialized descriptor vector index
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, contentIndex, descriptorIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").vector.QueryItemsRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").vector.QueryItemsResponse>} Response message
   */
  async QueryItems(req) {
    const index =
      req.index === "descriptor" ? this.#descriptorIndex : this.#contentIndex;

    this.debug("Querying vector index", {
      threshold: req.threshold,
      limit: req.limit,
      max_tokens: req.max_tokens || "unlimited",
      index: req.index,
    });

    const identifiers = await index.queryItems(
      req.vector,
      req.threshold,
      req.limit,
      req.max_tokens,
    );

    this.debug("Query complete", {
      index: req.index,
      count: identifiers.length,
    });

    return { identifiers };
  }
}

export { VectorService };
