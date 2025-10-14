/* eslint-env node */

import { Store, DataFactory } from "n3";
import { resource } from "@copilot-ld/libtype";
import { IndexBase } from "@copilot-ld/libutil";

const { namedNode, literal } = DataFactory;

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

    // Add quads to N3 store
    for (const quad of quads) {
      this.#graph.addQuad(
        namedNode(quad.subject),
        namedNode(quad.predicate),
        literal(quad.object),
      );
    }

    const item = {
      id: String(identifier),
      identifier,
      quads,
    };

    // Use parent class to update index in memory and on disk
    await super.addItem(item);
  }

  /**
   * Loads graph data from disk
   * @returns {Promise<void>}
   */
  async loadData() {
    // Clear the N3 store before loading
    this.#graph.removeMatches();

    // Use the common loading logic from IndexBase
    await super.loadData();

    // Add all quads to N3 store after loading
    for (const item of this.index.values()) {
      if (item.quads && Array.isArray(item.quads)) {
        for (const quad of item.quads) {
          this.#graph.addQuad(
            namedNode(quad.subject),
            namedNode(quad.predicate),
            literal(quad.object),
          );
        }
      }
    }
  }

  /**
   * Normalizes a query pattern by applying fallback logic
   * @param {object} pattern - Raw query pattern
   * @returns {object} Normalized pattern with wildcards and shorthand expanded
   * @private
   */
  #normalizePattern(pattern) {
    const typeShorthands = ["type", "@type"];
    return {
      subject: isWildcard(pattern.subject) ? null : pattern.subject,
      predicate: isWildcard(pattern.predicate)
        ? null
        : typeShorthands.includes(pattern.predicate)
          ? "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
          : pattern.predicate,
      object: isWildcard(pattern.object)
        ? null
        : pattern.object?.startsWith('"') && pattern.object.endsWith('"')
          ? pattern.object.slice(1, -1)
          : pattern.object,
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
      // Check if any of the item's quads have subjects that match our query
      if (item.quads && Array.isArray(item.quads)) {
        const hasMatch = item.quads.some((quad) => subjects.has(quad.subject));
        if (hasMatch) {
          identifiers.push(resource.Identifier.fromObject(item.identifier));
        }
      }
    }
    return identifiers;
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
    const normalizedPattern = this.#normalizePattern(pattern);

    // 2. Query the N3 store for matching triples
    const quads = this.#graph.getQuads(
      normalizedPattern.subject ? namedNode(normalizedPattern.subject) : null,
      normalizedPattern.predicate
        ? namedNode(normalizedPattern.predicate)
        : null,
      normalizedPattern.object ? literal(normalizedPattern.object) : null,
    );

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
 * parseGraphQuery('person:john type "Person"') // { subject: 'person:john', predicate: 'type', object: '"Person"' }
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

export { GraphProcessor } from "./processor.js";
