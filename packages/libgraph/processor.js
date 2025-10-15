/* eslint-env node */

import { Parser } from "n3";
import { ProcessorBase } from "@copilot-ld/libutil";

import { OntologyManager } from "./ontology.js";

/**
 * GraphProcessor class for processing resources with N-Quads into graph index
 * @augments {ProcessorBase}
 */
export class GraphProcessor extends ProcessorBase {
  #resourceIndex;
  #targetIndex;
  #ontology;

  /**
   * Creates a new GraphProcessor instance
   * @param {import("@copilot-ld/libgraph").GraphIndex} graphIndex - The graph index to store RDF quads
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance to process resources from
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance for debug output
   */
  constructor(graphIndex, resourceIndex, logger) {
    super(logger);
    if (!graphIndex) throw new Error("graphIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#resourceIndex = resourceIndex;
    this.#targetIndex = graphIndex;
    this.#ontology = new OntologyManager();
  }

  /** @inheritdoc */
  async processItem(item) {
    const id = String(item.identifier);

    // Skip if no N-Quads content
    if (!item.resource.content?.nquads) {
      this.logger.debug("Skipping resource without N-Quads", { id });
      return;
    }

    const quads = this.#rdfToQuads(item.resource.content.nquads);
    if (quads.length === 0) {
      this.logger.debug("No RDF found in N-Quads", { id });
      return;
    }

    // Add quads to the graph index
    await this.#targetIndex.addItem(item.identifier, quads);

    // Update ontology with quad information
    for (const quad of quads) {
      this.#ontology.processQuad(quad);
    }
  }

  /**
   * Parse N-Quads string into RDF quads
   * @param {string} rdf - N-Quads string
   * @returns {Array} Array of RDF quads
   * @private
   */
  #rdfToQuads(rdf) {
    try {
      const parser = new Parser({ format: "N-Quads" });
      return parser.parse(rdf);
    } catch (error) {
      this.logger.debug("Failed to parse N-Quads", { error: error.message });
      return [];
    }
  }

  /**
   * Saves the ontology to storage for agent consumption
   * @returns {Promise<void>}
   */
  async saveOntology() {
    const storage = this.#targetIndex.storage();
    const ontologyData = this.#ontology.getOntologyData();
    await storage.put("ontology.json", JSON.stringify(ontologyData, null, 2));
  }

  /**
   * Process resources from the resource index with N-Quads content
   * @param {string} actor - Actor identifier for access control
   * @returns {Promise<void>}
   */
  async process(actor) {
    // 1. Get all resource identifiers
    const identifiers = await this.#resourceIndex.findAll();

    // 2. Filter out conversations and their child resources
    const filteredIdentifiers = identifiers.filter(
      (id) => !String(id).startsWith("common.Conversation"),
    );

    // 3. Load the full resources using the identifiers
    const resources = await this.#resourceIndex.get(actor, filteredIdentifiers);

    // 4. Pre-filter resource contents that already exist in the target graph index
    const existing = new Set();
    const checks = await Promise.all(
      resources.map(async (resource) => ({
        id: String(resource.id),
        exists: await this.#targetIndex.hasItem(String(resource.id)),
      })),
    );
    checks
      .filter((check) => check.exists)
      .forEach((check) => existing.add(check.id));

    // Filter resources to only those that need processing
    const resourcesToProcess = [];
    for (const resource of resources) {
      // Only process resources with N-Quads content
      if (!resource.content?.nquads) {
        continue; // Skip resources without N-Quads
      }

      // Skip if already exists
      if (existing.has(String(resource.id))) {
        continue; // Skip existing resources
      }

      resourcesToProcess.push({
        resource: resource,
        identifier: resource.id,
      });
    }

    // 5. Use ProcessorBase to handle the batch processing
    await super.process(resourcesToProcess);

    // 6. Save the ontology after processing all items
    await this.saveOntology();
  }
}
