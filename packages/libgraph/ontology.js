/* eslint-env node */

import { DataFactory, Writer } from "n3";

const { namedNode, literal } = DataFactory;

/**
 * OntologyProcessor builds a lightweight SHACL shapes graph from observed RDF quads.
 *
 * It observes:
 * - rdf:type assertions to associate subjects with classes
 * - predicate usage per class (by seeing which predicates occur on instances of a class)
 * - global predicate frequency (used to order properties in the emitted SHACL)
 * - object types for properties to generate sh:class constraints
 * - inverse relationship patterns to generate sh:inversePath constraints
 *
 * Generated SHACL heuristics (radically simple):
 * For each class C we create a sh:NodeShape with:
 * sh:targetClass C
 * sh:property _:b ? with sh:path P for each predicate P seen on instances of C
 * sh:class constraints for object properties that consistently point to typed resources
 * sh:inversePath for detected inverse relationship pairs
 */
export class OntologyProcessor {
  #classSubjects; // Map<classIRI, Set<subjectIRI>>
  #subjectClasses; // Map<subjectIRI, Set<classIRI>>
  #classPredicates; // Map<classIRI, Map<predicateIRI, Set<subjectIRI>>> - tracks which subjects use each predicate
  #predicateCounts; // Map<predicateIRI, count>
  #predicateObjectTypes; // Map<predicateIRI, Map<classIRI, count>> - tracks what classes objects have
  #predicateDirections; // Map<"subj|pred|obj", count> - tracks directional triples for inverse detection

  constructor() {
    this.#classSubjects = new Map();
    this.#subjectClasses = new Map();
    this.#classPredicates = new Map();
    this.#predicateCounts = new Map();
    this.#predicateObjectTypes = new Map();
    this.#predicateDirections = new Map();
  }

  /**
   * Process a single RDF/JS quad
   * @param {import('rdf-js').Quad|any} quad - Quad object implementing RDF/JS terms
   */
  process(quad) {
    if (!quad) return;
    const subject = quad.subject?.value || "";
    const predicate = quad.predicate?.value || "";
    const object = quad.object?.value || "";
    const objectType = quad.object?.termType || "";
    if (!predicate || !subject) return;
    this.#incrementPredicate(predicate);
    if (this.#isTypePredicate(predicate) && object) {
      this.#recordTypeAssertion(subject, object);
      return;
    }
    this.#recordPredicateForSubjectClasses(subject, predicate);
    // Track object types for NamedNode objects (IRIs)
    if (objectType === "NamedNode" && object) {
      this.#recordPredicateObjectType(predicate, object);
      this.#recordInversePair(subject, predicate, object);
    }
  }

  /**
   * Increment global predicate usage counter
   * @param {string} predicate - Predicate IRI
   * @private
   */
  #incrementPredicate(predicate) {
    this.#predicateCounts.set(
      predicate,
      (this.#predicateCounts.get(predicate) || 0) + 1,
    );
  }

  /**
   * Determine if predicate is rdf:type
   * @param {string} predicate - Predicate IRI
   * @returns {boolean} true if rdf:type
   * @private
   */
  #isTypePredicate(predicate) {
    return predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
  }

  /**
   * Record rdf:type assertion
   * @param {string} subject - Subject IRI
   * @param {string} object - Class IRI
   * @private
   */
  #recordTypeAssertion(subject, object) {
    if (!this.#classSubjects.has(object))
      this.#classSubjects.set(object, new Set());
    this.#classSubjects.get(object).add(subject);
    if (!this.#subjectClasses.has(subject))
      this.#subjectClasses.set(subject, new Set());
    this.#subjectClasses.get(subject).add(object);
  }

  /**
   * Attribute predicate usage to all known classes for the subject
   * @param {string} subject - Subject IRI
   * @param {string} predicate - Predicate IRI
   * @private
   */
  #recordPredicateForSubjectClasses(subject, predicate) {
    const classes = this.#subjectClasses.get(subject);
    if (!classes) return;
    for (const cls of classes) {
      if (!this.#classPredicates.has(cls))
        this.#classPredicates.set(cls, new Map());
      const predMap = this.#classPredicates.get(cls);
      if (!predMap.has(predicate)) {
        predMap.set(predicate, new Set());
      }
      predMap.get(predicate).add(subject);
    }
  }

  /**
   * Record the type of object a predicate points to
   * @param {string} predicate - Predicate IRI
   * @param {string} object - Object IRI
   * @private
   */
  #recordPredicateObjectType(predicate, object) {
    const objectClasses = this.#subjectClasses.get(object);
    if (!objectClasses || objectClasses.size === 0) return;

    if (!this.#predicateObjectTypes.has(predicate)) {
      this.#predicateObjectTypes.set(predicate, new Map());
    }
    const typeMap = this.#predicateObjectTypes.get(predicate);
    for (const cls of objectClasses) {
      typeMap.set(cls, (typeMap.get(cls) || 0) + 1);
    }
  }

  /**
   * Record directional relationships for inverse detection
   * Tracks typed subject-predicate-object patterns
   * Note: Both subject and object must be typed before calling this method
   * @param {string} subject - Subject IRI
   * @param {string} predicate - Predicate IRI
   * @param {string} object - Object IRI
   * @private
   */
  #recordInversePair(subject, predicate, object) {
    // Get types for both subject and object
    const subjectClasses = this.#subjectClasses.get(subject);
    const objectClasses = this.#subjectClasses.get(object);

    // Only track if both entities are typed
    // Note: This means rdf:type triples must be processed before property triples
    // for inverse detection to work. This is guaranteed when all quads from a
    // resource are processed together (type assertions typically appear first).
    if (!subjectClasses || !objectClasses) return;

    // For each subject-object class pair, track this predicate
    for (const subjClass of subjectClasses) {
      for (const objClass of objectClasses) {
        const key = `${subjClass}|${predicate}|${objClass}`;
        this.#predicateDirections.set(
          key,
          (this.#predicateDirections.get(key) || 0) + 1,
        );
      }
    }
  }

  /**
   * Find inverse predicate for a given predicate between two classes
   * Returns the predicate that goes in the opposite direction
   * @param {string} fromClass - Source class IRI
   * @param {string} predicate - Predicate IRI
   * @param {string} toClass - Target class IRI
   * @returns {string|null} - The inverse predicate IRI or null
   * @private
   */
  #findInversePredicate(fromClass, predicate, toClass) {
    // Look for a predicate that goes from toClass to fromClass
    const forwardKey = `${fromClass}|${predicate}|${toClass}`;
    const forwardCount = this.#predicateDirections.get(forwardKey) || 0;

    if (forwardCount === 0) return null;

    // Search for reverse predicates
    let bestInverse = null;
    let bestScore = 0;

    for (const [key, count] of this.#predicateDirections.entries()) {
      const [subjClass, pred, objClass] = key.split("|");

      // Check if this is a reverse relationship
      if (
        subjClass === toClass &&
        objClass === fromClass &&
        pred !== predicate
      ) {
        // Score based on how consistently it appears as inverse
        const score = count;
        if (score > bestScore && score >= forwardCount * 0.5) {
          bestScore = score;
          bestInverse = pred;
        }
      }
    }

    return bestInverse;
  }

  /**
   * Get the dominant class for a predicate's objects
   * @param {string} predicate - Predicate IRI
   * @returns {string|null} - The most common class IRI or null
   * @private
   */
  #getDominantObjectClass(predicate) {
    const typeMap = this.#predicateObjectTypes.get(predicate);
    if (!typeMap || typeMap.size === 0) return null;

    let maxCount = 0;
    let dominantClass = null;
    for (const [cls, count] of typeMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantClass = cls;
      }
    }

    // Only return if there's a clear dominant class (>50% of occurrences)
    const totalCount = Array.from(typeMap.values()).reduce(
      (sum, c) => sum + c,
      0,
    );
    if (maxCount / totalCount > 0.5) {
      return dominantClass;
    }
    return null;
  }

  /**
   * Build SHACL shapes as Turtle text.
   * The output is framework agnostic and intentionally minimal.
   * @returns {string} Turtle serialization of SHACL shapes graph
   */
  buildShacl() {
    const writer = new Writer({ prefixes: this.#prefixes() });

    // Order classes by number of instances (descending)
    const classEntries = Array.from(this.#classSubjects.entries()).sort(
      (a, b) => b[1].size - a[1].size,
    );

    for (const [cls, subjects] of classEntries) {
      const shapeIri = `${cls}Shape`;
      const predicateMap = this.#classPredicates.get(cls) || new Map();
      // Order predicates by local frequency (desc) then global frequency
      const predicateEntries = Array.from(predicateMap.entries()).sort(
        (a, b) =>
          b[1].size - a[1].size ||
          (this.#predicateCounts.get(b[0]) || 0) -
            (this.#predicateCounts.get(a[0]) || 0),
      );

      const properties = predicateEntries.map(([predicate]) => ({
        predicate,
      }));

      // Emit NodeShape triples with proper literal values
      writer.addQuad(
        namedNode(shapeIri),
        namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
        namedNode("http://www.w3.org/ns/shacl#NodeShape"),
      );
      writer.addQuad(
        namedNode(shapeIri),
        namedNode("http://www.w3.org/ns/shacl#targetClass"),
        namedNode(cls),
      );
      writer.addQuad(
        namedNode(shapeIri),
        namedNode("http://purl.org/dc/terms/source"),
        namedNode(cls),
      );
      writer.addQuad(
        namedNode(shapeIri),
        namedNode("http://purl.org/dc/terms/description"),
        literal(`Shape for ${this.#localName(cls)} instances`),
      );
      writer.addQuad(
        namedNode(shapeIri),
        namedNode("http://www.w3.org/ns/shacl#name"),
        literal(this.#localName(cls)),
      );
      writer.addQuad(
        namedNode(shapeIri),
        namedNode("http://www.w3.org/ns/shacl#comment"),
        literal(`Instances: ${subjects.size}`),
      );

      for (const prop of properties) {
        // Get the distinct subject count for this predicate in this class
        const subjectSet = predicateMap.get(prop.predicate);
        const predicateCount = subjectSet ? subjectSet.size : 0;

        // Build property shape predicates
        const propertyPredicates = [
          {
            predicate: namedNode(
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            ),
            object: namedNode("http://www.w3.org/ns/shacl#PropertyShape"),
          },
          {
            predicate: namedNode("http://www.w3.org/ns/shacl#path"),
            object: namedNode(prop.predicate),
          },
          {
            predicate: namedNode("http://www.w3.org/ns/shacl#name"),
            object: literal(this.#localName(prop.predicate)),
          },
          {
            predicate: namedNode("http://www.w3.org/ns/shacl#comment"),
            object: literal(`Instances: ${predicateCount}`),
          },
        ];

        // Add sh:class constraint if there's a dominant object type
        const dominantClass = this.#getDominantObjectClass(prop.predicate);
        if (dominantClass) {
          propertyPredicates.push({
            predicate: namedNode("http://www.w3.org/ns/shacl#class"),
            object: namedNode(dominantClass),
          });
          propertyPredicates.push({
            predicate: namedNode("http://www.w3.org/ns/shacl#nodeKind"),
            object: namedNode("http://www.w3.org/ns/shacl#IRI"),
          });

          // Check for inverse predicate
          const inversePred = this.#findInversePredicate(
            cls,
            prop.predicate,
            dominantClass,
          );
          if (inversePred) {
            propertyPredicates.push({
              predicate: namedNode("http://www.w3.org/ns/shacl#inversePath"),
              object: namedNode(inversePred),
            });
          }
        }

        // Create a single blank node with all property shape predicates
        const bnodeId = writer.blank(propertyPredicates);

        // Connect the blank node to the shape
        writer.addQuad(
          namedNode(shapeIri),
          namedNode("http://www.w3.org/ns/shacl#property"),
          bnodeId,
        );
      }
    }

    let ttl = "";
    writer.end((err, result) => {
      if (err) throw err; // Let errors bubble up (coding instructions)
      ttl = result;
    });
    return ttl;
  }

  /**
   * Provide SHACL-friendly prefixes (best-effort) based on encountered IRIs.
   * @returns {Record<string,string>} prefix map
   * @private
   */
  #prefixes() {
    // Minimal built-ins; actual IRIs remain absolute if no prefix matches
    return {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      sh: "http://www.w3.org/ns/shacl#",
      dct: "http://purl.org/dc/terms/",
      schema: "https://schema.org/",
      foaf: "http://xmlns.com/foaf/0.1/",
    };
  }

  /**
   * Extract local name from IRI for human-readable labels
   * @param {string} iri - Full IRI string
   * @returns {string} local name
   * @private
   */
  #localName(iri) {
    if (!iri) return "";
    const hash = iri.lastIndexOf("#");
    const slash = iri.lastIndexOf("/");
    const idx = Math.max(hash, slash);
    return idx >= 0 ? iri.slice(idx + 1) : iri;
  }
}
