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
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libgraph").GraphIndex} graphIndex - Pre-initialized graph index
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, graphIndex, logFn) {
    super(config, logFn);
    this.#graphIndex = graphIndex;
  }

  /** @inheritdoc */
  async QueryItems(req) {
    this.debug("Querying graph index", {
      subject: req.subject,
      predicate: req.predicate,
      object: req.object,
    });

    const pattern = {
      subject: req.subject || null,
      predicate: req.predicate || null,
      object: req.object || null,
    };

    const identifiers = await this.#graphIndex.queryItems(pattern);

    this.debug("Query complete", {
      count: identifiers.length,
    });

    return { identifiers };
  }

  /** @inheritdoc */
  async GetItem(req) {
    this.debug("Getting item from graph index", {
      id: req.id,
    });

    const identifier = await this.#graphIndex.getItem(req.id);

    this.debug("Get item complete", {
      found: identifier !== null,
    });

    return { identifier };
  }

  /** @inheritdoc */
  async GetOntology(req) {
    this.debug("Getting ontology from graph storage");

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
            }
          }) 
        };
      }

      // Get the ontology file content
      const ontologyContent = await storage.get("ontology.json");
      
      // Handle both object and string formats
      const ontologyJson = typeof ontologyContent === "object" 
        ? JSON.stringify(ontologyContent)
        : ontologyContent;
      
      return { ontology_json: ontologyJson };
    } catch (error) {
      this.error("Failed to get ontology", { error: error.message });
      throw error;
    }
  }
}

// Export the service class (no bootstrap code here)
