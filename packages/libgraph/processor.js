/* eslint-env node */

import { ProcessorBase } from "@copilot-ld/libutil";

/**
 * Simple JSON-LD to quads converter for basic JSON-LD documents
 * @param {object} jsonld - JSON-LD document
 * @returns {object[]} Array of quad-like objects
 */
function jsonldToQuads(jsonld) {
  const quads = [];

  // Add type if present
  if (jsonld["@type"]) {
    quads.push({
      subject: jsonld["@id"] || "",
      predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      object: jsonld["@type"],
    });
  }

  // Add other properties
  for (const [key, value] of Object.entries(jsonld)) {
    if (key.startsWith("@")) continue; // Skip JSON-LD keywords

    // Expand prefixed properties if needed
    let predicate = key;
    if (key.includes(":") && jsonld["@context"]) {
      const [prefix, localPart] = key.split(":");
      if (jsonld["@context"][prefix]) {
        predicate = jsonld["@context"][prefix] + localPart;
      }
    }

    quads.push({
      subject: jsonld["@id"] || "",
      predicate: predicate,
      object: String(value),
    });
  }

  return quads;
}

/**
 * GraphProcessor class for processing resources into JSON-LD documents
 * @augments {ProcessorBase}
 */
export class GraphProcessor extends ProcessorBase {
  #resourceIndex;
  #targetIndex;
  #ontology;

  /**
   * Creates a new GraphProcessor instance
   * @param {import("@copilot-ld/libgraph").GraphIndex} graphIndex - The graph index to store JSON-LD documents
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance to process resources from
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance for debug output
   */
  constructor(graphIndex, resourceIndex, logger) {
    super(logger);
    if (!graphIndex) throw new Error("graphIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#resourceIndex = resourceIndex;
    this.#targetIndex = graphIndex;
    this.#ontology = {
      predicates: new Map(),
      types: new Map(),
      subjects: new Map(),
      patterns: new Set(),
    };
  }

  /**
   * Parse existing JSON-LD content
   * @param {*} jsonldContent - JSON-LD content to parse
   * @returns {object|null} Parsed JSON-LD or null
   * @private
   */
  #parseExistingJsonld(jsonldContent) {
    if (!jsonldContent) return null;
    try {
      return typeof jsonldContent === "string"
        ? JSON.parse(jsonldContent)
        : jsonldContent;
    } catch {
      return null;
    }
  }

  /** @inheritdoc */
  async processItem(item) {
    const resourceUri = String(item.identifier);

    // Create or use existing JSON-LD document
    let jsonld = this.#parseExistingJsonld(item.resource.content?.jsonld);

    if (!jsonld) {
      // Create JSON-LD document from resource data
      jsonld = {
        "@context": {
          "@vocab": "http://schema.org/",
          rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          dcterms: "http://purl.org/dc/terms/",
        },
        "@id": resourceUri,
        "@type": item.resource.id?.type || "Thing",
      };

      // Add content/description if available
      if (item.text && item.text.trim() !== "") {
        jsonld["dcterms:description"] = item.text;
      }

      // Add name/title if available
      if (item.resource.id && item.resource.id.name) {
        jsonld["dcterms:title"] = item.resource.id.name;
      }
    }

    // Ensure @id is set (fallback to resourceUri if not present in existing JSON-LD)
    if (!jsonld["@id"]) {
      jsonld["@id"] = resourceUri;
    }

    // Convert JSON-LD to quads
    const quads = jsonldToQuads(jsonld);

    // Update ontology with new quad information
    this.#updateOntology(quads);

    // Add quads to the index (not the JSON-LD)
    await this.#targetIndex.addItem(quads, item.identifier, jsonld["@id"]);

    return jsonld;
  }

  /**
   * Updates the ontology with information from new quads
   * @param {object[]} quads - Array of quad objects
   * @private
   */
  #updateOntology(quads) {
    for (const quad of quads) {
      // Track predicates
      const predCount = this.#ontology.predicates.get(quad.predicate) || 0;
      this.#ontology.predicates.set(quad.predicate, predCount + 1);

      // Track types when predicate is rdf:type
      if (
        quad.predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
      ) {
        const typeCount = this.#ontology.types.get(quad.object) || 0;
        this.#ontology.types.set(quad.object, typeCount + 1);

        // Track subjects by type
        if (!this.#ontology.subjects.has(quad.object)) {
          this.#ontology.subjects.set(quad.object, new Set());
        }
        this.#ontology.subjects.get(quad.object).add(quad.subject);
      }

      // Track common query patterns
      this.#ontology.patterns.add(`? ${quad.predicate} ?`);
      this.#ontology.patterns.add(`${quad.subject} ? ?`);
      if (
        quad.predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
      ) {
        this.#ontology.patterns.add(`? type ${quad.object}`);
      }
    }
  }

  /**
   * Saves the ontology to storage for agent consumption
   * @returns {Promise<void>}
   */
  async saveOntology() {
    const storage = this.#targetIndex.storage();

    // Convert Maps and Sets to serializable format
    const ontologyData = {
      predicates: Object.fromEntries(
        Array.from(this.#ontology.predicates.entries()).sort(
          (a, b) => b[1] - a[1],
        ), // Sort by frequency
      ),
      types: Object.fromEntries(
        Array.from(this.#ontology.types.entries()).sort((a, b) => b[1] - a[1]), // Sort by frequency
      ),
      subjectsByType: Object.fromEntries(
        Array.from(this.#ontology.subjects.entries()).map(
          ([type, subjects]) => [
            type,
            Array.from(subjects).slice(0, 5), // Limit to 5 examples per type
          ],
        ),
      ),
      commonPatterns: Array.from(this.#ontology.patterns).slice(0, 20), // Limit to 20 most common patterns
      statistics: {
        totalPredicates: this.#ontology.predicates.size,
        totalTypes: this.#ontology.types.size,
        totalSubjects: Array.from(this.#ontology.subjects.values()).reduce(
          (total, subjects) => total + subjects.size,
          0,
        ),
        lastUpdated: new Date().toISOString(),
      },
    };

    await storage.put("ontology.json", JSON.stringify(ontologyData, null, 2));
  }

  /**
   * Process resources from the resource index for JSON-LD documents
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
      // Only process content representation of resources
      const text = resource.content ? String(resource.content) : null;

      if (text === null || text === "null" || text.trim() === "") {
        continue; // Skip resources with no content
      }

      // Skip if already exists
      if (existing.has(String(resource.id))) {
        continue; // Skip existing resources
      }

      resourcesToProcess.push({
        text: text,
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
