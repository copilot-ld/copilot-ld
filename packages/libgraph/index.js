/* eslint-env node */

import { Store, DataFactory } from "n3";
import { resource } from "@copilot-ld/libtype";
import { IndexBase } from "@copilot-ld/libutil";
import { createStorage } from "@copilot-ld/libstorage";

const { namedNode, literal } = DataFactory;

/**
 * Standard RDF namespace prefixes used throughout the graph system
 */
export const RDF_PREFIXES = {
  schema: "https://schema.org/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  foaf: "http://xmlns.com/foaf/0.1/",
  ex: "https://example.invalid/",
};

/**
 * Checks if a value should be treated as a wildcard in graph queries
 * @param {any} value - The value to check
 * @returns {boolean} True if the value represents a wildcard
 */
function isWildcard(value) {
  const wildcards = ["?", "*", "_", "null", "NULL"];
  return !value || wildcards.includes(value);
}

/**
 * GraphIndex class for managing RDF graph data with lazy loading
 */
export class GraphIndex extends IndexBase {
  #graph;

  /**
   * Creates a new GraphIndex instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage interface for data operations
   * @param {Store} store - N3 Store instance for graph operations
   * @param {string} [indexKey] - The index file name to use for storage (default: "index.jsonl")
   */
  constructor(storage, store, indexKey = "index.jsonl") {
    super(storage, indexKey);
    if (!store || !(store instanceof Store))
      throw new Error("store must be an N3 Store instance");

    this.#graph = store;
  }

  /**
   * Adds quads to the index with identifier mapping
   * @param {resource.Identifier} identifier - Resource identifier
   * @param {object[]} quads - Array of quad objects with subject, predicate, object
   * @returns {Promise<void>}
   */
  async addItem(identifier, quads) {
    if (!this.loaded) await this.loadData();

    for (const quad of quads) {
      this.#graph.addQuad(quad.subject, quad.predicate, quad.object);
    }

    const item = {
      id: String(identifier),
      identifier,
      quads,
    };

    await super.addItem(item);
  }

  /**
   * Loads graph data from disk
   * @returns {Promise<void>}
   */
  async loadData() {
    this.#graph.removeMatches();
    await super.loadData();

    for (const item of this.index.values()) {
      if (item.quads && Array.isArray(item.quads)) {
        for (const quad of item.quads) {
          this.#graph.addQuad(quad.subject, quad.predicate, quad.object);
        }
      }
    }
  }

  /**
   * Normalizes a query pattern by converting wildcards to null
   * @param {object} pattern - Raw query pattern
   * @returns {object} Normalized pattern with wildcards converted to null
   * @private
   */
  #normalizePattern(pattern) {
    return {
      subject: isWildcard(pattern.subject) ? null : pattern.subject,
      predicate: isWildcard(pattern.predicate) ? null : pattern.predicate,
      object: isWildcard(pattern.object) ? null : pattern.object,
    };
  }

  /**
   * Finds resource identifiers that match the given subjects
   * @param {Set<string>} subjects - Set of subject URIs that matched the query
   * @returns {resource.Identifier[]} Array of resource identifiers
   * @private
   */
  #findMatchingIdentifiers(subjects) {
    const identifiers = [];
    for (const item of this.index.values()) {
      if (item.quads && Array.isArray(item.quads)) {
        const hasMatch = item.quads.some((quad) => {
          return subjects.has(quad.subject.value);
        });
        if (hasMatch) {
          identifiers.push(resource.Identifier.fromObject(item.identifier));
        }
      }
    }
    return identifiers;
  }

  /**
   * Converts a pattern term to the appropriate N3 term type
   * @param {string|null} term - The term to convert
   * @returns {import("n3").Term|null} N3 term or null for wildcards
   * @private
   */
  #patternTermToN3Term(term) {
    if (!term) return null;

    if (term.startsWith('"') && term.endsWith('"')) {
      return literal(term.slice(1, -1));
    }

    if (term.includes(":")) {
      const [prefix, localName] = term.split(":", 2);

      if (RDF_PREFIXES[prefix]) {
        return namedNode(RDF_PREFIXES[prefix] + localName);
      }
    }

    if (term.startsWith("http://") || term.startsWith("https://")) {
      return namedNode(term);
    }

    return literal(term);
  }

  /**
   * Queries items from this graph index using SPARQL-like patterns
   * @param {object} pattern - Query pattern with subject, predicate, object (wildcards converted to null)
   * @param {import("@copilot-ld/libtype").tool.QueryFilter} filter - Filter object for query constraints
   * @returns {Promise<resource.Identifier[]>} Array of resource identifiers
   */
  async queryItems(pattern, filter = {}) {
    if (!this.loaded) await this.loadData();

    // 1. Normalize query pattern
    const normalized = this.#normalizePattern(pattern);

    // 2. Convert pattern terms to N3 terms, letting N3 handle prefix expansion
    const subjectTerm = normalized.subject
      ? this.#patternTermToN3Term(normalized.subject)
      : null;
    const predicateTerm = normalized.predicate
      ? this.#patternTermToN3Term(normalized.predicate)
      : null;
    const objectTerm = normalized.object
      ? this.#patternTermToN3Term(normalized.object)
      : null;

    // 3. Query the N3 store for matching triples
    const quads = this.#graph.getQuads(subjectTerm, predicateTerm, objectTerm);

    if (quads.length === 0) {
      return [];
    }

    // 3. Collect matching subjects and find identifiers
    const matchingSubjects = new Set();
    for (const quad of quads) {
      matchingSubjects.add(quad.subject.value);
    }

    let identifiers = this.#findMatchingIdentifiers(matchingSubjects);

    // Apply shared filters
    const { prefix, limit, max_tokens } = filter;

    if (prefix) {
      identifiers = identifiers.filter((identifier) =>
        this._applyPrefixFilter(String(identifier), prefix),
      );
    }

    let results = this._applyLimitFilter(identifiers, limit);
    results = this._applyTokensFilter(results, max_tokens);

    return results;
  }
}

/**
 * Parses a space-delimited graph query line into a triple object
 * @param {string} line - Query line in format: <subject> <predicate> <object>
 * @returns {object} Triple object with subject, predicate, object as strings
 * @example
 * parseGraphQuery('person:john ? ?') // { subject: 'person:john', predicate: '?', object: '?' }
 * parseGraphQuery('? foaf:name "John Doe"') // { subject: '?', predicate: 'foaf:name', object: '"John Doe"' }
 * parseGraphQuery('person:john rdf:type schema:Person') // { subject: 'person:john', predicate: 'rdf:type', object: 'schema:Person' }
 */
export function parseGraphQuery(line) {
  if (typeof line !== "string") {
    throw new Error("line must be a string");
  }

  const trimmed = line.trim();
  if (!trimmed) {
    throw new Error("line cannot be empty");
  }

  // Check for unterminated quotes
  const quoteCount = (trimmed.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    throw new Error("Unterminated quoted string");
  }

  // Use regex to split on spaces but preserve quoted strings
  const terms = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  if (terms.length !== 3) {
    throw new Error(
      `Expected 3 parts (subject predicate object), got ${terms.length}`,
    );
  }

  const [subject, predicate, object] = terms;
  return { subject, predicate, object };
}

/**
 * Creates a GraphIndex instance with default configuration
 * @param {string} [indexKey] - The index file name to use for storage (default: "index.jsonl")
 * @returns {GraphIndex} Configured GraphIndex instance
 */
export function createGraphIndex(indexKey = "index.jsonl") {
  const storage = createStorage("graphs");
  const n3Store = new Store({
    prefixes: RDF_PREFIXES,
  });

  return new GraphIndex(storage, n3Store, indexKey);
}
