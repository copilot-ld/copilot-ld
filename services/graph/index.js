/* eslint-env node */
import { services } from "@copilot-ld/librpc";

const { GraphBase } = services;

/**
 * Graph service for querying RDF graph data
 */
export class GraphService extends GraphBase {
  #graphIndex;

  /**
   * Creates a new Graph service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {import("@copilot-ld/libgraph").GraphIndex} graphIndex - Pre-initialized graph index
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory function
   */
  constructor(config, graphIndex, logFn) {
    super(config, logFn);
    if (!graphIndex) throw new Error("graphIndex is required");

    this.#graphIndex = graphIndex;
  }

  /**
   * Query graph index using pattern matching
   * @param {import("@copilot-ld/libtype").graph.PatternQuery} req - Pattern query request
   * @returns {Promise<import("@copilot-ld/libtype").tool.QueryResults>} Query results with resource strings
   */
  async QueryByPattern(req) {
    const pattern = {
      subject: req.subject || null,
      predicate: req.predicate || null,
      object: req.object || null,
    };

    const identifiers = await this.#graphIndex.queryItems(pattern, req?.filter);
    return { identifiers };
  }

  /** @inheritdoc */
  async GetOntology(_req) {
    const storage = this.#graphIndex.storage();

    const content = String((await storage.get("ontology.ttl")) || "");
    return { content };
  }
}
