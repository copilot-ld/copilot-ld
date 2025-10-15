/* eslint-env node */
import { services } from "@copilot-ld/librpc";

const { GraphBase } = services;

/**
 * Graph service for querying RDF graph data
 */
export class GraphService extends GraphBase {
  #graphIndex;
  #resourceIndex;

  /**
   * Creates a new Graph service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libgraph").GraphIndex} graphIndex - Pre-initialized graph index
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Pre-initialized resource index
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, graphIndex, resourceIndex, logFn) {
    super(config, logFn);
    if (!graphIndex) throw new Error("graphIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#graphIndex = graphIndex;
    this.#resourceIndex = resourceIndex;
  }

  /**
   * Query graph index using pattern matching
   * @param {import("@copilot-ld/libtype").graph.PatternQuery} req - Pattern query request
   * @returns {Promise<import("@copilot-ld/libtype").tool.QueryResults>} Query results with resource strings
   */
  async QueryByPattern(req) {
    this.debug("Graph query", {
      subject: req.subject,
      predicate: req.predicate,
      object: req.object,
      limit: req.filter?.limit,
      max_tokens: req.filter?.max_tokens,
    });

    // 1. Build query pattern from request
    const pattern = {
      subject: req.subject || null,
      predicate: req.predicate || null,
      object: req.object || null,
    };

    // 2. Query graph index with pattern
    const identifiers = await this.#graphIndex.queryItems(pattern, req?.filter);

    this.debug("Graph query results", {
      count: identifiers.length,
    });

    // 3. Get content strings from resource identifiers
    const results = await this.#getResources(identifiers);

    return { results };
  }

  /** @inheritdoc */
  async GetOntology(_req) {
    this.debug("Getting ontology");

    const storage = this.#graphIndex.storage();

    try {
      // Check if ontology exists
      const exists = await storage.exists("ontology.json");
      if (!exists) {
        this.debug("Ontology file not found");
        return {
          ontology_json: JSON.stringify({
            predicates: {},
            types: {},
            subjectsByType: {},
            commonPatterns: [],
            statistics: {
              totalPredicates: 0,
              totalTypes: 0,
              totalSubjects: 0,
              lastUpdated: new Date().toISOString(),
            },
          }),
        };
      }

      // Get the ontology file content
      const ontologyContent = await storage.get("ontology.json");

      // Handle both object and string formats
      const ontologyJson =
        typeof ontologyContent === "object"
          ? JSON.stringify(ontologyContent)
          : ontologyContent;

      return { ontology_json: ontologyJson };
    } catch (error) {
      this.error("Failed to get ontology", { error: error.message });
      throw error;
    }
  }

  /**
   * Retrieves resource strings from resource identifiers
   * @param {string[]} identifiers - Resource identifiers
   * @returns {Promise<string[]>} Array of resource strings
   * @private
   */
  async #getResources(identifiers) {
    if (!identifiers?.length) {
      return [];
    }

    // Get resources from the index
    const actor = "common.System.root";
    const resources = await this.#resourceIndex.get(
      actor,
      identifiers.map((id) => String(id)),
    );

    // Extract content strings from resources
    const contents = resources
      .map((resource) => {
        // Not all resources have content, fallback to descriptor
        return resource.content
          ? String(resource.content)
          : String(resource.descriptor);
      })
      .filter((content) => content.length > 0);

    return contents;
  }
}
