/* eslint-env node */

/**
 * OntologyProcessor builds a lightweight SHACL shapes graph from observed RDF quads.
 * Observes rdf:type assertions, predicate usage per class, global predicate frequency,
 * object types, and inverse relationship patterns to generate SHACL NodeShapes with
 * sh:targetClass, sh:property, sh:class constraints, and sh:inversePath constraints.
 */
export class OntologyProcessor {
  #classSubjects; // Map<classIRI, Set<subjectIRI>>
  #subjectClasses; // Map<subjectIRI, Set<classIRI>>
  #classPredicates; // Map<classIRI, Map<predicateIRI, Set<subjectIRI>>>
  #predicateCounts; // Map<predicateIRI, count>
  #predicateObjectTypes; // Map<predicateIRI, Map<classIRI, count>>
  #predicateDirections; // Map<"subj|pred|obj", count>
  #inversePredicates; // Map<"fromClass|predicate|toClass", inversePredicate>

  /**
   *
   */
  constructor() {
    this.#classSubjects = new Map();
    this.#subjectClasses = new Map();
    this.#classPredicates = new Map();
    this.#predicateCounts = new Map();
    this.#predicateObjectTypes = new Map();
    this.#predicateDirections = new Map();
    this.#inversePredicates = new Map();
  }

  /**
   * Process a single RDF/JS quad
   * @param {import('rdf-js').Quad|any} quad - Quad object implementing RDF/JS terms
   */
  process(quad) {
    if (!quad) return;
    const subject = quad.subject?.value;
    const predicate = quad.predicate?.value;
    if (!predicate || !subject) return;

    this.#incrementPredicate(predicate);

    const object = quad.object?.value;
    if (this.#isTypePredicate(predicate)) {
      if (object) this.#recordTypeAssertion(subject, object);
      return;
    }

    this.#recordPredicateForSubjectClasses(subject, predicate);
    this.#processObjectIfNamedNode(quad.object, predicate, subject);
  }

  /**
   *
   * @param objectNode
   * @param predicate
   * @param subject
   */
  #processObjectIfNamedNode(objectNode, predicate, subject) {
    if (objectNode?.termType !== "NamedNode" || !objectNode.value) return;
    this.#recordPredicateObjectType(predicate, objectNode.value);
    this.#recordInversePair(subject, predicate, objectNode.value);
  }

  /**
   *
   * @param predicate
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
   *
   * @param subject
   * @param object
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
   *
   * @param subject
   * @param predicate
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
   *
   * @param predicate
   * @param object
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
   *
   * @param subject
   * @param predicate
   * @param object
   */
  #recordInversePair(subject, predicate, object) {
    const subjectClasses = this.#subjectClasses.get(subject);
    const objectClasses = this.#subjectClasses.get(object);
    if (!subjectClasses || !objectClasses) return;
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
   * Compute inverse predicates for all class-predicate-class relationships.
   * Call this after all quads have been processed via process().
   * @private
   */
  #computeInversePredicates() {
    for (const [
      forwardKey,
      forwardCount,
    ] of this.#predicateDirections.entries()) {
      const [fromClass, predicate, toClass] = forwardKey.split("|");
      if (forwardCount === 0) continue;

      let bestInverse = null;
      let bestScore = 0;

      for (const [key, count] of this.#predicateDirections.entries()) {
        const [subjClass, pred, objClass] = key.split("|");
        if (
          subjClass === toClass &&
          objClass === fromClass &&
          pred !== predicate
        ) {
          if (count > bestScore && count >= forwardCount * 0.5) {
            bestScore = count;
            bestInverse = pred;
          }
        }
      }

      if (bestInverse) {
        this.#inversePredicates.set(forwardKey, bestInverse);
      }
    }
  }

  /**
   * Returns a read-only view of collected ontology statistics.
   * MUST be called after all quads are processed.
   * WARNING: Do not mutate the returned Maps or Sets. They are internal data structures
   * shared with the processor for performance. This method is intended only for
   * serializer consumption within the same package.
   * @returns {import('./serializer.js').OntologyData} Ontology data snapshot containing class subjects, predicates, and inverse relationships
   */
  getData() {
    // Compute inverse predicates once before returning data
    this.#computeInversePredicates();

    return {
      classSubjects: this.#classSubjects,
      subjectClasses: this.#subjectClasses,
      classPredicates: this.#classPredicates,
      predicateCounts: this.#predicateCounts,
      predicateObjectTypes: this.#predicateObjectTypes,
      inversePredicates: this.#inversePredicates,
    };
  }
}
