/* eslint-env node */
import { DataFactory, Writer } from "n3";
import { getProps, toShortName } from "./schema.js";

const { namedNode, literal } = DataFactory;

/**
 * @typedef {object} OntologyData
 * @property {Map<string, Set<string>>} typeInstances - Type IRI to subject IRIs
 * @property {Map<string, Map<string, Set<string>>>} typeProperties - Type properties
 * @property {Map<string, Map<string, number>>} propertyObjectTypes - Object type counts
 * @property {Map<string, Set<string>>} schemaPropertyUsage - Used schema properties
 * @property {Record<string, object>} schemaDefinitions - Schema definitions
 */

/**
 * SHACL Turtle serializer for ontology data.
 * Supports both schema-defined and discovered properties.
 */
export class ShaclSerializer {
  /**
   * Serialize ontology data to SHACL Turtle format
   * @param {OntologyData} ontologyData - Ontology data from OntologyProcessor
   * @returns {string} SHACL Turtle string
   */
  serialize(ontologyData) {
    if (!ontologyData) throw new Error("ontologyData is required");
    const writer = new Writer({ prefixes: this.#getPrefixes() });

    const classEntries = Array.from(ontologyData.typeInstances.entries()).sort(
      (a, b) => b[1].size - a[1].size,
    );

    for (const [cls, subjects] of classEntries) {
      const shapeIri = `${cls}Shape`;
      const shortName = toShortName(cls);
      const schemaDef = ontologyData.schemaDefinitions[shortName];
      this.#addShapeMetadata(writer, shapeIri, cls, subjects.size, schemaDef);

      // Merge schema-defined and observed properties
      const allProperties = this.#mergeProperties(
        getProps(schemaDef),
        ontologyData.typeProperties.get(cls) || new Map(),
      );

      // Sort: observed first, then by count
      const sortedProps = Array.from(allProperties.entries()).sort((a, b) => {
        if (a[1].observed && !b[1].observed) return -1;
        if (!a[1].observed && b[1].observed) return 1;
        return b[1].count - a[1].count;
      });

      for (const [predicate, propInfo] of sortedProps) {
        const dominantClass =
          propInfo.schemaRange ||
          this.#getDominantObjectClass(
            predicate,
            ontologyData.propertyObjectTypes,
          );

        const predicates = this.#buildPropertyPredicates(
          predicate,
          propInfo.count,
          dominantClass,
          propInfo.schemaDefined,
          propInfo.observed,
        );
        const bnodeId = writer.blank(predicates);
        writer.addQuad(
          namedNode(shapeIri),
          namedNode("http://www.w3.org/ns/shacl#property"),
          bnodeId,
        );
      }
    }

    let ttl = "";
    writer.end((err, result) => {
      if (err) throw err;
      ttl = result;
    });
    return ttl;
  }

  /**
   * Get SHACL namespace prefixes
   * @returns {object} SHACL prefixes
   */
  #getPrefixes() {
    return {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      sh: "http://www.w3.org/ns/shacl#",
      dct: "http://purl.org/dc/terms/",
      schema: "https://schema.org/",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      skos: "http://www.w3.org/2004/02/skos/core#",
    };
  }

  /**
   * Extract local name from IRI
   * @param {string} iri - Full IRI
   * @returns {string} Local name portion
   */
  #getLocalName(iri) {
    if (!iri) return "";
    const idx = Math.max(iri.lastIndexOf("#"), iri.lastIndexOf("/"));
    return idx >= 0 ? iri.slice(idx + 1) : iri;
  }

  /**
   * Merge schema-defined and observed properties
   * @param {Record<string, string>} schemaProps - Schema-defined properties (compact format)
   * @param {Map<string, Set<string>>} observedProps - Observed properties
   * @returns {Map<string, object>} Merged properties
   */
  #mergeProperties(schemaProps, observedProps) {
    const merged = new Map();

    // Add schema-defined properties (compact format: { propName: range })
    for (const [propName, range] of Object.entries(schemaProps)) {
      // Expand property name to full IRI for matching with observed
      const propIRI = "https://schema.org/" + propName;
      // Check if range is a type reference (not Text/Date/Number)
      const isTypeRef = range && !["Text", "Date", "Number"].includes(range);
      merged.set(propIRI, {
        schemaDefined: true,
        schemaRange: isTypeRef ? "https://schema.org/" + range : null,
        observed: false,
        count: 0,
      });
    }

    // Add/update with observed properties
    for (const [propIRI, subjects] of observedProps.entries()) {
      if (merged.has(propIRI)) {
        const prop = merged.get(propIRI);
        prop.observed = true;
        prop.count = subjects.size;
      } else {
        merged.set(propIRI, {
          schemaDefined: false,
          schemaRange: null,
          observed: true,
          count: subjects.size,
        });
      }
    }

    return merged;
  }

  /**
   * Add shape metadata to writer
   * @param {Writer} writer - N3 Writer
   * @param {string} shapeIri - Shape IRI
   * @param {string} classIri - Class IRI
   * @param {number} instanceCount - Number of instances
   * @param {object} schemaDef - Schema definition with aliases, examples, props
   */
  #addShapeMetadata(writer, shapeIri, classIri, instanceCount, schemaDef) {
    const shapeNode = namedNode(shapeIri);
    const rdfType = namedNode(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    );
    const status = schemaDef ? " (schema-defined)" : " (discovered)";

    writer.addQuad(
      shapeNode,
      rdfType,
      namedNode("http://www.w3.org/ns/shacl#NodeShape"),
    );
    writer.addQuad(
      shapeNode,
      namedNode("http://www.w3.org/ns/shacl#targetClass"),
      namedNode(classIri),
    );
    writer.addQuad(
      shapeNode,
      namedNode("http://purl.org/dc/terms/source"),
      namedNode(classIri),
    );
    writer.addQuad(
      shapeNode,
      namedNode("http://purl.org/dc/terms/description"),
      literal(`Shape for ${this.#getLocalName(classIri)} instances${status}`),
    );
    writer.addQuad(
      shapeNode,
      namedNode("http://www.w3.org/ns/shacl#name"),
      literal(this.#getLocalName(classIri)),
    );
    writer.addQuad(
      shapeNode,
      namedNode("http://www.w3.org/ns/shacl#comment"),
      literal(`Instances: ${instanceCount}`),
    );

    // Add aliases via skos:altLabel
    if (schemaDef?.aliases?.length > 0) {
      for (const alias of schemaDef.aliases) {
        writer.addQuad(
          shapeNode,
          namedNode("http://www.w3.org/2004/02/skos/core#altLabel"),
          literal(alias),
        );
      }
    }
  }

  /**
   * Build property predicates for SHACL property shape
   * @param {string} predicateIri - Property IRI
   * @param {number} instanceCount - Usage count
   * @param {string|null} dominantClass - Dominant object class
   * @param {boolean} schemaDefined - Whether schema-defined
   * @param {boolean} observed - Whether observed in data
   * @returns {Array} Property predicates
   */
  #buildPropertyPredicates(
    predicateIri,
    instanceCount,
    dominantClass,
    schemaDefined,
    observed,
  ) {
    const rdfType = namedNode(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    );

    let comment = `Instances: ${instanceCount}`;
    if (schemaDefined && !observed) {
      comment = "Schema-defined (not yet observed)";
    } else if (schemaDefined && observed) {
      comment += " (schema-defined)";
    } else {
      comment += " (discovered)";
    }

    const predicates = [
      {
        predicate: rdfType,
        object: namedNode("http://www.w3.org/ns/shacl#PropertyShape"),
      },
      {
        predicate: namedNode("http://www.w3.org/ns/shacl#path"),
        object: namedNode(predicateIri),
      },
      {
        predicate: namedNode("http://www.w3.org/ns/shacl#name"),
        object: literal(this.#getLocalName(predicateIri)),
      },
      {
        predicate: namedNode("http://www.w3.org/ns/shacl#comment"),
        object: literal(comment),
      },
    ];

    if (dominantClass) {
      predicates.push(
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#class"),
          object: namedNode(dominantClass),
        },
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#nodeKind"),
          object: namedNode("http://www.w3.org/ns/shacl#IRI"),
        },
      );
    }

    return predicates;
  }

  /**
   * Get dominant object class for a predicate
   * @param {string} predicate - Predicate IRI
   * @param {Map<string, Map<string, number>>} predicateObjectTypes - Object type map
   * @returns {string|null} Dominant class IRI or null
   */
  #getDominantObjectClass(predicate, predicateObjectTypes) {
    const typeMap = predicateObjectTypes.get(predicate);
    if (!typeMap || typeMap.size === 0) return null;

    let max = 0;
    let dom = null;
    for (const [cls, count] of typeMap.entries()) {
      if (count > max) {
        max = count;
        dom = cls;
      }
    }
    const total = Array.from(typeMap.values()).reduce((s, c) => s + c, 0);
    return max / total > 0.5 ? dom : null;
  }
}
