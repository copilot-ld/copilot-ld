/* eslint-env node */
import { VectorBase } from "../../generated/services/vector/service.js";

/**
 * Vector search service for querying content and descriptor vector indexes
 */
export class VectorService extends VectorBase {
  #contentIndex;
  #descriptorIndex;

  /**
   * Creates a new Vector service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} contentIndex - Pre-initialized content vector index
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} descriptorIndex - Pre-initialized descriptor vector index
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, contentIndex, descriptorIndex, logFn) {
    super(config, logFn);
    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
  }

  /** @inheritdoc */
  async QueryItems(req) {
    const index =
      req.index === "descriptor" ? this.#descriptorIndex : this.#contentIndex;

    this.debug("Querying index", {
      index: req.index,
      threshold: req.filters?.threshold,
      limit: req.filters?.limit,
    });

    const identifiers = await index.queryItems(req.vector, req.filters || {});

    this.debug("Query complete", {
      index: req.index,
      count: identifiers.length,
    });

    return { identifiers };
  }

  /** @inheritdoc */
  async GetItem(req) {
    const index =
      req.index === "descriptor" ? this.#descriptorIndex : this.#contentIndex;

    this.debug("Getting item from vector index", {
      id: req.id,
      index: req.index,
    });

    const identifier = await index.getItem(req.id);

    this.debug("Get item complete", {
      index: req.index,
      found: identifier !== null,
    });

    return { identifier };
  }
}

// Export the service class (no bootstrap code here)
