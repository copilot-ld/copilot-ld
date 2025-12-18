/* eslint-env node */

/**
 * OntologyProcessor builds a SHACL shapes graph using top-down Schema.org knowledge
 * combined with observed data patterns. Uses LLM to normalize discovered types.
 */

import {
  hasSchemaDefinition,
  getSchemaDefinition,
  mergeAliases,
  toShortName,
} from "../schema.js";
import {
  normalizeType,
  enrichSchemas,
  validateSchemas,
  extractLocalName,
} from "./llm-normalizer.js";

const RDF_TYPE_IRI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

/**
 * @typedef {object} OntologyData
 * @property {Map<string, Set<string>>} typeInstances - Type IRI to subject IRIs
 * @property {Map<string, Map<string, Set<string>>>} typeProperties - Type properties
 * @property {Map<string, Map<string, number>>} propertyObjectTypes - Object type counts
 * @property {Map<string, Set<string>>} schemaPropertyUsage - Used schema properties
 * @property {Record<string, object>} schemaDefinitions - Schema definitions
 * @property {Map<string, Set<string>>} typeExamples - Type IRI to example entity names
 * @property {Map<string, string>} entityNames - Subject IRI to name string
 */

/** OntologyProcessor using top-down Schema.org knowledge with LLM enhancement */
export class OntologyProcessor {
  #typeInstances = new Map();
  #subjectTypes = new Map();
  #typeProperties = new Map();
  #propertyObjectTypes = new Map();
  #schemaPropertyUsage = new Map();
  #unknownTypes = new Set();
  #schemaDefinitions = null;
  #typeMapping = new Map();
  #logger = null;
  #typeExamples = new Map(); // Type IRI -> Set of example names
  #entityNames = new Map(); // Subject IRI -> name string

  /**
   * Creates a new OntologyProcessor instance
   * @param {object} [logger] - Logger instance
   */
  constructor(logger) {
    this.#logger = logger || null;
  }

  /**
   * Set schema definitions for type validation
   * @param {Record<string, object>} definitions - Schema definitions
   */
  setSchemaDefinitions(definitions) {
    this.#schemaDefinitions = definitions;
  }

  /**
   * Process an RDF quad and update ontology statistics
   * @param {object} quad - RDF quad to process
   */
  process(quad) {
    if (!quad) return;
    const subject = quad.subject?.value;
    const predicate = quad.predicate?.value;
    if (!predicate || !subject) return;

    if (predicate === RDF_TYPE_IRI && quad.object?.value) {
      this.#recordTypeAssertion(subject, quad.object.value);
      return;
    }

    // Capture schema:name for examples
    if (
      predicate === "https://schema.org/name" &&
      quad.object?.termType === "Literal"
    ) {
      this.#recordEntityName(subject, quad.object.value);
    }

    this.#recordPropertyForSubjectTypes(subject, predicate);
    this.#processObjectIfNamedNode(quad.object, predicate);
  }

  /**
   * Record a type assertion for a subject
   * @param {string} subject - Subject IRI
   * @param {string} typeIRI - Type IRI
   */
  #recordTypeAssertion(subject, typeIRI) {
    if (!this.#typeInstances.has(typeIRI)) {
      this.#typeInstances.set(typeIRI, new Set());
    }
    this.#typeInstances.get(typeIRI).add(subject);

    if (!this.#subjectTypes.has(subject)) {
      this.#subjectTypes.set(subject, new Set());
    }
    this.#subjectTypes.get(subject).add(typeIRI);

    if (this.#schemaDefinitions) {
      if (hasSchemaDefinition(this.#schemaDefinitions, typeIRI)) {
        if (!this.#schemaPropertyUsage.has(typeIRI)) {
          this.#schemaPropertyUsage.set(typeIRI, new Set());
        }
      } else {
        this.#unknownTypes.add(typeIRI);
      }
    }
  }

  /**
   * Record a property usage for all types of a subject
   * @param {string} subject - Subject IRI
   * @param {string} predicate - Predicate IRI
   */
  #recordPropertyForSubjectTypes(subject, predicate) {
    const types = this.#subjectTypes.get(subject);
    if (!types) return;

    for (const typeIRI of types) {
      if (!this.#typeProperties.has(typeIRI)) {
        this.#typeProperties.set(typeIRI, new Map());
      }
      const propMap = this.#typeProperties.get(typeIRI);
      if (!propMap.has(predicate)) {
        propMap.set(predicate, new Set());
      }
      propMap.get(predicate).add(subject);

      if (this.#schemaPropertyUsage.has(typeIRI)) {
        const def = getSchemaDefinition(this.#schemaDefinitions, typeIRI);
        const propShortName = predicate.replace("https://schema.org/", "");
        if (def?.props?.[propShortName]) {
          this.#schemaPropertyUsage.get(typeIRI).add(predicate);
        }
      }
    }
  }

  /**
   * Record entity name for example collection
   * @param {string} subject - Subject IRI
   * @param {string} name - Entity name
   */
  #recordEntityName(subject, name) {
    this.#entityNames.set(subject, name);
    const types = this.#subjectTypes.get(subject);
    if (!types) return;

    for (const typeIRI of types) {
      if (!this.#typeExamples.has(typeIRI)) {
        this.#typeExamples.set(typeIRI, new Set());
      }
      const examples = this.#typeExamples.get(typeIRI);
      if (examples.size < 10) {
        examples.add(name);
      }
    }
  }

  /**
   * Process object node to track property object types
   * @param {object} objectNode - Object node from quad
   * @param {string} predicate - Predicate IRI
   */
  #processObjectIfNamedNode(objectNode, predicate) {
    if (objectNode?.termType !== "NamedNode" || !objectNode.value) return;
    const objectTypes = this.#subjectTypes.get(objectNode.value);
    if (!objectTypes?.size) return;

    if (!this.#propertyObjectTypes.has(predicate)) {
      this.#propertyObjectTypes.set(predicate, new Map());
    }
    const typeMap = this.#propertyObjectTypes.get(predicate);
    for (const t of objectTypes) {
      typeMap.set(t, (typeMap.get(t) || 0) + 1);
    }
  }

  /**
   * Finalize with LLM operations
   * @param {object} llm - LLM instance
   * @returns {Promise<Map<string, string>>} Type mapping
   */
  async finalize(llm) {
    if (!llm) {
      this.#log("warn", "No LLM provided, skipping normalization");
      return this.#typeMapping;
    }

    await this.#normalizeTypes(llm);
    await enrichSchemas(
      llm,
      this.#unknownTypes,
      this.#schemaDefinitions,
      this.#log.bind(this),
    );
    validateSchemas(
      this.#typeInstances,
      this.#typeProperties,
      this.#schemaDefinitions || {},
      this.#log.bind(this),
    );

    return this.#typeMapping;
  }

  /**
   * Normalize unknown types using LLM
   * @param {object} llm - LLM instance
   */
  async #normalizeTypes(llm) {
    this.#log("info", "Normalizing discovered types...");
    const unknownTypesArray = Array.from(this.#unknownTypes);
    if (!unknownTypesArray.length) {
      this.#log("info", "No types to normalize");
      return;
    }

    for (const typeIRI of unknownTypesArray) {
      const props = this.#typeProperties.get(typeIRI);
      const propNames = props
        ? Array.from(props.keys()).map(extractLocalName).slice(0, 5)
        : [];

      const canonical = await normalizeType(
        llm,
        typeIRI,
        propNames,
        this.#log.bind(this),
      );
      if (canonical) {
        this.#typeMapping.set(typeIRI, canonical);
      }
    }

    this.#applyTypeMappings();
    this.#log("info", `Normalized ${this.#typeMapping.size} types`);
  }

  /** Apply type mappings to merge statistics and add type aliases */
  #applyTypeMappings() {
    for (const [discovered, canonical] of this.#typeMapping.entries()) {
      const instances = this.#typeInstances.get(discovered);
      if (!instances) continue;

      if (!this.#typeInstances.has(canonical)) {
        this.#typeInstances.set(canonical, new Set());
      }
      instances.forEach((i) => this.#typeInstances.get(canonical).add(i));

      const props = this.#typeProperties.get(discovered);
      if (props) {
        if (!this.#typeProperties.has(canonical)) {
          this.#typeProperties.set(canonical, new Map());
        }
        const canonProps = this.#typeProperties.get(canonical);
        for (const [p, subjs] of props.entries()) {
          if (!canonProps.has(p)) canonProps.set(p, new Set());
          subjs.forEach((s) => canonProps.get(p).add(s));
        }
      }

      // Add discovered type as alias of canonical type in schema definitions
      // e.g., Individual → Person means "Individual" is an alias for Person
      if (this.#schemaDefinitions) {
        const canonicalShortName = toShortName(canonical);
        const discoveredShortName = toShortName(discovered);
        const def = this.#schemaDefinitions[canonicalShortName];
        if (def) {
          mergeAliases(def, [discoveredShortName]);
          this.#log(
            "debug",
            `Added type alias: ${discoveredShortName} → ${canonicalShortName}`,
          );
        }
      }

      this.#typeInstances.delete(discovered);
      this.#typeProperties.delete(discovered);
      this.#unknownTypes.delete(discovered);
    }
  }

  /**
   * Get ontology data for serializer
   * @returns {OntologyData} Ontology data snapshot
   */
  getData() {
    return {
      typeInstances: this.#typeInstances,
      typeProperties: this.#typeProperties,
      propertyObjectTypes: this.#propertyObjectTypes,
      schemaPropertyUsage: this.#schemaPropertyUsage,
      schemaDefinitions: this.#schemaDefinitions || {},
      typeExamples: this.#typeExamples,
      entityNames: this.#entityNames,
    };
  }

  /**
   * Get type mapping result
   * @returns {Map<string, string>} Type mapping
   */
  getTypeMapping() {
    return this.#typeMapping;
  }

  /**
   * Log message
   * @param {string} level - Log level
   * @param {string} message - Message to log
   */
  #log(level, message) {
    if (this.#logger) {
      this.#logger[level]?.("OntologyProcessor", message);
    } else {
      console.log(`[OntologyProcessor] ${message}`);
    }
  }
}
