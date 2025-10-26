/* eslint-env node */

import { Parser } from "n3";
import { ProcessorBase } from "@copilot-ld/libutil";

import { OntologyProcessor } from "./ontology.js";
import { ShaclSerializer } from "./serializer.js";

/**
 * GraphProcessor class for processing resources with N-Quads into graph index
 * @augments {ProcessorBase}
 */
export class GraphProcessor extends ProcessorBase {
  #resourceIndex;
  #targetIndex;
  #ontologyProcessor;
  #serializer;

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
    this.#ontologyProcessor = new OntologyProcessor();
    this.#serializer = new ShaclSerializer();
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

    // CRITICAL: Sort quads to ensure rdf:type assertions are processed before
    // property triples. OntologyProcessor's inverse relationship detection
    // requires type information to be available when processing object properties.
    // This is defensive - ResourceProcessor should already provide canonical
    // ordering, but we enforce it here for robustness against other quad sources.
    // See: SCRATCHPAD.md "RDF Quad Ordering for Reliable Processing"
    quads.sort((a, b) => {
      const aIsType = this.#isTypePredicate(a.predicate.value);
      const bIsType = this.#isTypePredicate(b.predicate.value);
      if (aIsType && !bIsType) return -1;
      if (!aIsType && bIsType) return 1;
      return 0;
    });

    // Add quads to the graph index
    // Include token count in identifier for token filtering
    const tokens =
      item.resource.content?.tokens || item.resource.descriptor?.tokens;
    if (!tokens) {
      throw new Error(`Resource missing tokens: ${String(item.identifier)}`);
    }

    // Add tokens directly to the identifier object (protobuf instance)
    item.identifier.tokens = tokens;
    await this.#targetIndex.add(item.identifier, quads);

    // Update ontology with quad information
    for (const quad of quads) {
      this.#ontologyProcessor.process(quad);
    }
  }

  /**
   * Check if a predicate is rdf:type
   * @param {string} predicate - Predicate IRI
   * @returns {boolean} True if predicate is rdf:type
   * @private
   */
  #isTypePredicate(predicate) {
    return predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
  }

  /**
   * Parse N-Quads string into RDF quads
   * @param {string} rdf - N-Quads string
   * @returns {Array} Array of RDF quads
   * @private
   */
  #rdfToQuads(rdf) {
    const parser = new Parser({ format: "N-Quads" });
    return parser.parse(rdf);
  }

  /**
   * Saves the ontology to storage for agent consumption
   * @returns {Promise<void>}
   */
  async saveOntology() {
    const storage = this.#targetIndex.storage();
    const data = this.#ontologyProcessor.getData();
    const ttl = this.#serializer.serialize(data);
    await storage.put("ontology.ttl", ttl);
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
    const resources = await this.#resourceIndex.get(filteredIdentifiers, actor);

    // 4. Pre-filter resource contents that already exist in the target graph index
    const existing = new Set();
    const checks = await Promise.all(
      resources.map(async (resource) => ({
        id: String(resource.id),
        exists: await this.#targetIndex.has(String(resource.id)),
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
