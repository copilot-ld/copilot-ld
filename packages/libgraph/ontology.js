/* eslint-env node */

/**
 * Ontology management helper for tracking RDF patterns
 */
export class OntologyManager {
  #ontology;

  constructor() {
    this.#ontology = {
      predicates: new Map(),
      types: new Map(),
      subjects: new Map(),
      patterns: new Set(),
    };
  }

  /**
   * Process a single quad for ontology updates
   * @param {object} quad - Single quad object
   */
  processQuad(quad) {
    const { subject, predicate, object } = this.#extractQuadValues(quad);

    if (!predicate) return;

    this.#trackPredicate(predicate);
    this.#trackTypeRelations(subject, predicate, object);
    this.#trackPatterns(subject, predicate);
  }

  /**
   * Extract values from quad object
   * @param {object} quad - Quad object (N3 term objects)
   * @returns {{subject: string, predicate: string, object: string}} Extracted values
   * @private
   */
  #extractQuadValues(quad) {
    return {
      subject: quad.subject.value || "",
      predicate: quad.predicate.value || "",
      object: quad.object.value || "",
    };
  }

  /**
   * Track predicate usage in ontology
   * @param {string} predicate - Predicate URI
   * @private
   */
  #trackPredicate(predicate) {
    const predicateCount = this.#ontology.predicates.get(predicate) || 0;
    this.#ontology.predicates.set(predicate, predicateCount + 1);
  }

  /**
   * Track type relations in ontology
   * @param {string} subject - Subject URI
   * @param {string} predicate - Predicate URI
   * @param {string} object - Object value
   * @private
   */
  #trackTypeRelations(subject, predicate, object) {
    if (
      predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
      object
    ) {
      const typeCount = this.#ontology.types.get(object) || 0;
      this.#ontology.types.set(object, typeCount + 1);

      if (!this.#ontology.subjects.has(object)) {
        this.#ontology.subjects.set(object, new Set());
      }
      if (subject) {
        this.#ontology.subjects.get(object).add(subject);
      }
    }
  }

  /**
   * Track common patterns in ontology
   * @param {string} subject - Subject URI
   * @param {string} predicate - Predicate URI
   * @private
   */
  #trackPatterns(subject, predicate) {
    if (subject && predicate) {
      this.#ontology.patterns.add(`${predicate}`);
    }
  }

  /**
   * Generate serializable ontology data
   * @returns {object} Ontology data ready for storage
   */
  getOntologyData() {
    return {
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
  }
}
