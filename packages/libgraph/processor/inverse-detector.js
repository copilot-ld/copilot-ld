/* eslint-env node */

/**
 * InverseDetector detects bidirectional/inverse relationships in RDF data.
 * Tracks predicate directions and identifies predicates that connect types
 * in both directions (e.g., Person→knows→Person bidirectionally).
 */
export class InverseDetector {
  #predicateDirections = new Map(); // "subjectClass|predicate|objectClass" → count
  #inversePredicates = new Map(); // "fromClass|predicate|toClass" → inversePredicate
  #oneWayPredicates = new Set([
    "https://schema.org/citation",
    "https://schema.org/mentions",
    "https://schema.org/about",
    "https://schema.org/isRelatedTo",
    "https://schema.org/references",
    "https://schema.org/sameAs",
    "https://schema.org/url",
  ]);

  /**
   * Record inverse pair for bidirectional relationship detection
   * @param {string} subject - Subject IRI
   * @param {string} predicate - Predicate IRI
   * @param {string} object - Object IRI
   * @param {Map<string, Set<string>>} subjectTypes - Map of subject to its types
   */
  recordInversePair(subject, predicate, object, subjectTypes) {
    const subjTypes = subjectTypes.get(subject);
    const objTypes = subjectTypes.get(object);
    if (!subjTypes || !objTypes) return;

    for (const subjClass of subjTypes) {
      for (const objClass of objTypes) {
        const key = `${subjClass}|${predicate}|${objClass}`;
        this.#predicateDirections.set(
          key,
          (this.#predicateDirections.get(key) || 0) + 1,
        );
      }
    }
  }

  /**
   * Compute inverse predicates by detecting bidirectional relationships
   * If same predicate connects types in both directions, it's its own inverse
   */
  computeInversePredicates() {
    for (const [key] of this.#predicateDirections.entries()) {
      const [fromClass, predicate, toClass] = key.split("|");

      // Skip one-way predicates that shouldn't have inverses
      if (this.#oneWayPredicates.has(predicate)) continue;

      // Check if reverse direction exists with same predicate
      const reverseKey = `${toClass}|${predicate}|${fromClass}`;
      if (this.#predicateDirections.has(reverseKey)) {
        // Bidirectional - predicate is its own inverse
        this.#inversePredicates.set(key, predicate);
      }
    }
  }

  /**
   * Get computed inverse predicates
   * @returns {Map<string, string>} Map of direction key to inverse predicate
   */
  getInversePredicates() {
    return this.#inversePredicates;
  }
}
