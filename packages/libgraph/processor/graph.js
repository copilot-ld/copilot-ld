/* eslint-env node */

import { Parser, DataFactory } from "n3";
import { ProcessorBase } from "@copilot-ld/libutil";

import { EntityMerger } from "./entity-merger.js";
import { IndexUpdater } from "./index-updater.js";
import { OntologyProcessor } from "./ontology.js";
import { ShaclSerializer } from "../serializer.js";
import { loadSchemaDefinitions, saveSchemaDefinitions } from "../schema.js";
import { updateSchemaWithDiscoveries } from "./llm-normalizer.js";

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
  #entityMerger;
  #indexUpdater;

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
    this.#indexUpdater = new IndexUpdater(graphIndex.storage(), logger);
    if (llm) {
      this.#entityMerger = new EntityMerger(llm, logger);
    }
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
   * Detect synonyms and apply entity merging
   * @returns {Promise<void>}
   * @private
   */
  async #detectAndMergeSynonyms() {
    if (!this.#entityMerger) return;

    const data = this.#ontologyProcessor.getData();
    await this.#entityMerger.detectAndBuildMergeMap(
      data.typeExamples,
      data.entityNames,
    );

    const mergeMap = this.#entityMerger.getMergeMap();
    if (mergeMap.size > 0) {
      await this.#indexUpdater.applyEntityMerging(mergeMap);
    }
  }

  /**
   * Saves the ontology to storage for agent consumption
   * @returns {Promise<void>}
   */
  async saveOntology() {
    const storage = this.#targetIndex.storage();

    let typeMapping = new Map();
    if (this.#llm) {
      this.logger.debug("GraphProcessor", "Running LLM finalization...");
      typeMapping = await this.#ontologyProcessor.finalize(this.#llm);

      if (typeMapping.size > 0) {
        await this.#indexUpdater.applyTypeMapping(typeMapping);
      }

      await this.#detectAndMergeSynonyms();
    } else {
      this.logger.error(
        "GraphProcessor",
        "No LLM provided, skipping type normalization",
      );
    }

    const data = this.#ontologyProcessor.getData();
    const ttl = this.#serializer.serialize(data);
    await storage.put("ontology.ttl", ttl);

    await this.#saveSchemaUpdates(data);

    this.logger.debug("GraphProcessor", "Ontology saved", {
      types: data.typeInstances.size,
      normalized: typeMapping.size,
    });
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

    const synonymResults = this.#entityMerger
      ? this.#entityMerger.getSynonymResults()
      : [];

    updateSchemaWithDiscoveries(
      this.#schemaDefinitions,
      data.typeExamples,
      synonymResults,
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
