/* eslint-env node */
/* eslint-disable max-lines */

import { Parser, DataFactory } from "n3";
import { ProcessorBase } from "@copilot-ld/libutil";

import { OntologyProcessor } from "./ontology.js";
import { ShaclSerializer } from "../serializer.js";
import {
  loadSchemaDefinitions,
  saveSchemaDefinitions,
  toShortName,
} from "../schema.js";
import {
  detectSynonyms,
  updateSchemaWithDiscoveries,
} from "./llm-normalizer.js";

const { namedNode: _namedNode } = DataFactory;
const RDF_TYPE_IRI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

/**
 * GraphProcessor class for processing resources with N-Quads into graph index
 * Uses top-down Schema.org knowledge with LLM enhancement for ontology generation
 * @augments {ProcessorBase}
 */
export class GraphProcessor extends ProcessorBase {
  #resourceIndex;
  #targetIndex;
  #ontologyProcessor;
  #serializer;
  #llm;
  #initialized;
  #schemaDefinitions;
  #synonymResults = [];
  #entityMergeMap = new Map(); // alias IRI → canonical IRI

  /**
   * Creates a new GraphProcessor instance
   * @param {import("@copilot-ld/libgraph").GraphIndex} graphIndex - The graph index to store RDF quads
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance to process resources from
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance for debug output
   * @param {object} [llm] - Optional LLM instance from libcopilot for type normalization
   */
  constructor(graphIndex, resourceIndex, logger, llm = null) {
    super(logger);
    if (!graphIndex) throw new Error("graphIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#resourceIndex = resourceIndex;
    this.#targetIndex = graphIndex;
    this.#ontologyProcessor = new OntologyProcessor(logger);
    this.#serializer = new ShaclSerializer();
    this.#llm = llm;
    this.#initialized = false;
  }

  /**
   * Initialize async dependencies (schema definitions)
   * Must be called before processing
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.#initialized) return;

    try {
      this.#schemaDefinitions = await loadSchemaDefinitions();
      this.#ontologyProcessor.setSchemaDefinitions(this.#schemaDefinitions);
      this.logger.debug("GraphProcessor", "Loaded schema definitions", {
        count: Object.keys(this.#schemaDefinitions).length,
      });
    } catch (error) {
      this.logger.error(
        "GraphProcessor",
        "Failed to load schema definitions, continuing without",
        { error: error.message },
      );
      this.#schemaDefinitions = {};
    }

    this.#initialized = true;
  }

  /** @inheritdoc */
  async processItem(item) {
    const id = String(item.identifier);

    // Skip if no content
    if (!item.resource.content) {
      this.logger.debug("Processor", "Skipping resource without N-Quads", {
        id,
      });
      return;
    }

    // Try to parse RDF content, skip if it fails
    let quads;
    try {
      quads = this.#rdfToQuads(item.resource.content);
    } catch (error) {
      this.logger.debug("Processor", "Skipping non-RDF content", {
        id,
        error: error.message,
      });
      return;
    }

    if (quads.length === 0) {
      this.logger.debug("Processor", "No RDF found in content", { id });
      return;
    }

    // CRITICAL: Sort quads to ensure rdf:type assertions are processed before
    // property triples. OntologyProcessor requires type information to be
    // available when processing object properties for schema validation.
    quads.sort((a, b) => {
      const aIsType = this.#isTypePredicate(a.predicate.value);
      const bIsType = this.#isTypePredicate(b.predicate.value);
      if (aIsType && !bIsType) return -1;
      if (!aIsType && bIsType) return 1;
      return 0;
    });

    // Add quads to the graph index
    // Token count is already on identifier from withIdentifier()
    if (!item.identifier.tokens) {
      throw new Error(`Resource missing tokens: ${String(item.identifier)}`);
    }

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
    return predicate === RDF_TYPE_IRI;
  }

  /**
   * Parse RDF string into RDF quads
   * @param {string} rdf - RDF string
   * @returns {Array} Array of RDF quads
   * @private
   */
  #rdfToQuads(rdf) {
    const parser = new Parser({ format: "Turtle" });
    return parser.parse(rdf);
  }

  /**
   * Apply type mapping to quads in the graph index
   * Updates rdf:type assertions with normalized canonical types
   * @param {Map<string, string>} typeMapping - Map of discovered type -> canonical type
   * @returns {Promise<void>}
   * @private
   */
  async #applyTypeMappingToIndex(typeMapping) {
    if (typeMapping.size === 0) return;

    this.logger.debug("GraphProcessor", "Applying type mapping to index", {
      mappings: typeMapping.size,
    });

    const storage = this.#targetIndex.storage();

    try {
      // Storage automatically parses .jsonl files into arrays
      const entries = await storage.get("index.jsonl");
      if (!entries || !Array.isArray(entries)) return;

      // Update quads with normalized types
      for (const entry of entries) {
        if (entry.quads && Array.isArray(entry.quads)) {
          entry.quads = entry.quads.map((quad) => {
            // Only normalize rdf:type object values
            if (
              quad.predicate?.value === RDF_TYPE_IRI &&
              quad.object?.termType === "NamedNode"
            ) {
              const canonicalType = typeMapping.get(quad.object.value);
              if (canonicalType) {
                return {
                  ...quad,
                  object: { ...quad.object, value: canonicalType },
                };
              }
            }
            return quad;
          });
        }
      }

      // Write back updated index (as JSONL)
      const jsonlContent =
        entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await storage.put("index.jsonl", jsonlContent);

      this.logger.debug("GraphProcessor", "Type mapping applied to index", {
        entries: entries.length,
      });
    } catch (error) {
      this.logger.error(
        "GraphProcessor",
        "Failed to apply type mapping to index",
        { error: error.message },
      );
    }
  }

  /**
   * Saves the ontology to storage for agent consumption
   * @returns {Promise<void>}
   */
  async saveOntology() {
    const storage = this.#targetIndex.storage();

    // Finalize with LLM operations (type normalization, enrichment, validation)
    let typeMapping = new Map();
    if (this.#llm) {
      this.logger.debug("GraphProcessor", "Running LLM finalization...");
      typeMapping = await this.#ontologyProcessor.finalize(this.#llm);

      // Apply type mapping to index entries
      if (typeMapping.size > 0) {
        await this.#applyTypeMappingToIndex(typeMapping);
      }

      // Run synonym detection for types with multiple entities
      await this.#detectAndMergeSynonyms();
    } else {
      this.logger.error(
        "GraphProcessor",
        "No LLM provided, skipping type normalization",
      );
    }

    // Generate and save ontology TTL
    const data = this.#ontologyProcessor.getData();
    const ttl = this.#serializer.serialize(data);
    await storage.put("ontology.ttl", ttl);

    // Save updated schema with discovered examples and synonyms
    await this.#saveSchemaUpdates(data);

    this.logger.debug("GraphProcessor", "Ontology saved", {
      types: data.typeInstances.size,
      normalized: typeMapping.size,
    });
  }

  /**
   * Build reverse map from entity name to IRIs
   * @param {Map<string, string>} entityNames - IRI to name map
   * @returns {Map<string, string[]>} Name to IRIs map
   * @private
   */
  #buildNameToIRIMap(entityNames) {
    const nameToIRI = new Map();
    for (const [iri, name] of entityNames.entries()) {
      if (!nameToIRI.has(name)) {
        nameToIRI.set(name, []);
      }
      nameToIRI.get(name).push(iri);
    }
    return nameToIRI;
  }

  /**
   * Build entity merge map from synonym merges
   * @param {Array} merges - Synonym merge results
   * @param {Map<string, string[]>} nameToIRI - Name to IRIs map
   * @private
   */
  #buildEntityMergeMap(merges, nameToIRI) {
    for (const merge of merges) {
      const canonicalIRIs = nameToIRI.get(merge.canonical) || [];
      if (canonicalIRIs.length === 0) continue;

      const canonicalIRI = canonicalIRIs[0];

      for (const alias of merge.aliases) {
        const aliasIRIs = nameToIRI.get(alias) || [];
        for (const aliasIRI of aliasIRIs) {
          if (aliasIRI !== canonicalIRI) {
            this.#entityMergeMap.set(aliasIRI, canonicalIRI);
            this.logger.debug(
              "GraphProcessor",
              `Entity merge: ${alias} → ${merge.canonical}`,
            );
          }
        }
      }
    }
  }

  /**
   * Detect synonyms among entities for each type and build entity merge map
   * @returns {Promise<void>}
   * @private
   */
  async #detectAndMergeSynonyms() {
    const data = this.#ontologyProcessor.getData();
    this.#synonymResults = [];
    this.#entityMergeMap = new Map();

    const nameToIRI = this.#buildNameToIRIMap(data.entityNames);

    for (const [typeIRI, examples] of data.typeExamples.entries()) {
      const exampleNames = Array.from(examples);
      if (exampleNames.length < 2) continue;

      const typeName = toShortName(typeIRI);
      const merges = await detectSynonyms(
        this.#llm,
        typeName,
        exampleNames,
        (level, msg) => this.logger[level]?.("GraphProcessor", msg),
      );

      if (merges.length > 0) {
        this.#synonymResults.push({ typeIRI, merges });
        this.#buildEntityMergeMap(merges, nameToIRI);
      }
    }

    this.logger.debug("GraphProcessor", "Synonym detection complete", {
      typesWithSynonyms: this.#synonymResults.length,
      entitiesToMerge: this.#entityMergeMap.size,
    });

    if (this.#entityMergeMap.size > 0) {
      await this.#applyEntityMerging();
    }
  }

  /**
   * Apply entity merging to the graph index
   * Updates all references to alias entities to point to canonical entities
   * @returns {Promise<void>}
   * @private
   */
  async #applyEntityMerging() {
    if (this.#entityMergeMap.size === 0) return;

    this.logger.debug("GraphProcessor", "Applying entity merging to index", {
      merges: this.#entityMergeMap.size,
    });

    const storage = this.#targetIndex.storage();

    try {
      // Storage automatically parses .jsonl files into arrays
      const entries = await storage.get("index.jsonl");
      if (!entries || !Array.isArray(entries)) return;

      let mergedCount = 0;

      for (const entry of entries) {
        if (entry.quads && Array.isArray(entry.quads)) {
          entry.quads = entry.quads.map((quad) => {
            let modified = false;

            // Check if subject should be merged
            if (
              quad.subject?.value &&
              this.#entityMergeMap.has(quad.subject.value)
            ) {
              quad = {
                ...quad,
                subject: {
                  ...quad.subject,
                  value: this.#entityMergeMap.get(quad.subject.value),
                },
              };
              modified = true;
            }

            // Check if object should be merged (for NamedNode objects)
            if (
              quad.object?.termType === "NamedNode" &&
              this.#entityMergeMap.has(quad.object.value)
            ) {
              quad = {
                ...quad,
                object: {
                  ...quad.object,
                  value: this.#entityMergeMap.get(quad.object.value),
                },
              };
              modified = true;
            }

            if (modified) mergedCount++;
            return quad;
          });
        }
      }

      // Write back updated index (as JSONL)
      const jsonlContent =
        entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await storage.put("index.jsonl", jsonlContent);

      this.logger.debug("GraphProcessor", "Entity merging applied", {
        entries: entries.length,
        triplesUpdated: mergedCount,
      });
    } catch (error) {
      this.logger.error("GraphProcessor", "Failed to apply entity merging", {
        error: error.message,
      });
    }
  }

  /**
   * Save schema updates with discovered examples and synonyms
   * @param {object} data - Ontology data from processor
   * @returns {Promise<void>}
   * @private
   */
  async #saveSchemaUpdates(data) {
    if (
      !this.#schemaDefinitions ||
      Object.keys(this.#schemaDefinitions).length === 0
    ) {
      return;
    }

    updateSchemaWithDiscoveries(
      this.#schemaDefinitions,
      data.typeExamples,
      this.#synonymResults,
      (level, msg) => this.logger[level]?.("GraphProcessor", msg),
    );

    await saveSchemaDefinitions(this.#schemaDefinitions);
    this.logger.debug("GraphProcessor", "Schema definitions updated and saved");
  }

  /**
   * Process resources from the resource index with N-Quads content
   * @param {string} actor - Actor identifier for access control
   * @returns {Promise<void>}
   */
  async process(actor) {
    // Initialize async dependencies (schema definitions)
    await this.initialize();

    // 1. Get all resource identifiers
    const identifiers = await this.#resourceIndex.findAll();

    // 2. Filter out resources that don't contain RDF content
    // Only common.Message resources (from HTML knowledge sources) contain RDF
    const filteredIdentifiers = identifiers.filter((identifier) => {
      const id = String(identifier);
      return (
        !id.startsWith("common.Conversation") &&
        !id.startsWith("common.Assistant") &&
        !id.startsWith("tool.ToolFunction")
      );
    });

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
      // Only process resources with content
      if (!resource.content) {
        continue; // Skip resources without content
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
