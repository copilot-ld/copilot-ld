/* eslint-env node */
import { services } from "@copilot-ld/librpc";

const { GraphBase } = services;

/**
 * Graph service for querying RDF triple data
 */
export class GraphService extends GraphBase {
  #tripleIndex;

  /**
   * Creates a new Graph service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libtriple").TripleIndexInterface} tripleIndex - Pre-initialized triple index
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, tripleIndex, logFn) {
    super(config, logFn);
    this.#tripleIndex = tripleIndex;
  }

  /** @inheritdoc */
  async QueryItems(req) {
    this.debug("Querying triple index", {
      subject: req.pattern?.subject,
      predicate: req.pattern?.predicate,
      object: req.pattern?.object,
    });

    const pattern = {
      subject: req.pattern?.subject || null,
      predicate: req.pattern?.predicate || null,
      object: req.pattern?.object || null,
    };

    const identifiers = await this.#tripleIndex.queryItems(pattern);

    this.debug("Query complete", {
      count: identifiers.length,
    });

    return { identifiers };
  }

  /** @inheritdoc */
  async GetItem(req) {
    this.debug("Getting item from triple index", {
      id: req.id,
    });

    const identifier = await this.#tripleIndex.getItem(req.id);

    this.debug("Get item complete", {
      found: identifier !== null,
    });

    return { identifier };
  }
}

// Export the service class (no bootstrap code here)
