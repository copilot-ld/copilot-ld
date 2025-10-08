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
 * TripleProcessor class for processing resources into JSON-LD documents
 * @augments {ProcessorBase}
 */
export class TripleProcessor extends ProcessorBase {
  #resourceIndex;
  #targetIndex;

  /**
   * Creates a new TripleProcessor instance
   * @param {import("@copilot-ld/libtriple").TripleIndex} tripleIndex - The triple index to store JSON-LD documents
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance to process resources from
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance for debug output
   */
  constructor(tripleIndex, resourceIndex, logger) {
    super(logger);
    if (!tripleIndex) throw new Error("tripleIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    this.#resourceIndex = resourceIndex;
    this.#targetIndex = tripleIndex;
  }

  /**
   * Process resources from the resource index for JSON-LD documents
   * @param {string} actor - Actor identifier for access control
   * @returns {Promise<void>}
   */
  async process(actor) {
    const identifiers = await this.#resourceIndex.findAll();

    // Don't index conversations, and their child resources (e.g. messages)
    const filteredIdentifiers = identifiers.filter(
      (id) => !String(id).startsWith("common.Conversation"),
    );

    // Load the full resources using the identifiers
    const resources = await this.#resourceIndex.get(actor, filteredIdentifiers);

    // Pre-filter resource contents that already exist in the target triple index
    const existing = new Set();
    const checks = await Promise.all(
      resources.map(async (resource) => ({
        id: resource.id,
        exists: await this.#targetIndex.hasItem(resource.id),
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
      if (existing.has(resource.id)) {
        continue; // Skip existing resources
      }

      resourcesToProcess.push({
        text: text,
        resource: resource,
        identifier: resource.id,
      });
    }

    // Use ProcessorBase to handle the batch processing
    await super.process(resourcesToProcess);
  }

  /** @inheritdoc */
  async processItem(item) {
    const resourceUri = String(item.identifier);

    // Create or use existing JSON-LD document
    let jsonld;
    if (item.resource.content && item.resource.content.jsonld) {
      // Parse existing JSON-LD from resource (it's stored as a string)
      try {
        jsonld =
          typeof item.resource.content.jsonld === "string"
            ? JSON.parse(item.resource.content.jsonld)
            : item.resource.content.jsonld;
      } catch {
        // If parsing fails, fall back to generating JSON-LD
        jsonld = null;
      }
    }

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

    // Add quads to the index (not the JSON-LD)
    await this.#targetIndex.addItem(quads, item.identifier, jsonld["@id"]);

    return jsonld;
  }
}
