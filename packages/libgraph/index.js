/* eslint-env node */

import { Store, DataFactory } from "n3";
import { resource } from "@copilot-ld/libtype";

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
export class GraphIndex {
  #storage;
  #store;
  #indexKey;
  #index = new Map();
  #loaded = false;

  /**
   * Creates a new GraphIndex instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage interface for data operations
   * @param {Store} store - N3 Store instance for graph operations
   * @param {string} [indexKey] - The index file name to use for storage (default: "index.jsonl")
   */
  constructor(storage, store, indexKey = "index.jsonl") {
    if (!storage) throw new Error("storage is required");
    if (!store || !(store instanceof Store))
      throw new Error("store must be an N3 Store instance");

    this.#storage = storage;
    this.#store = store;
    this.#indexKey = indexKey;
  }

  /**
   * Gets the storage instance
   * @returns {import("@copilot-ld/libstorage").StorageInterface} Storage instance
   */
  storage() {
    return this.#storage;
  }

  /**
   * Gets the index key (filename)
   * @returns {string} The index key
   */
  get indexKey() {
    return this.#indexKey;
  }

  /**
   * Adds quads to the index with identifier mapping
   * @param {object[]} quads - Array of quad objects with subject, predicate, object
   * @param {resource.Identifier} identifier - Resource identifier
   * @param {string} subjectUri - The JSON-LD @id URI for this resource
   * @returns {Promise<void>}
   */
  async addItem(quads, identifier, subjectUri) {
    if (!this.#loaded) await this.loadData();

    // Add quads to N3 store
    for (const quad of quads) {
      this.#store.addQuad(
        namedNode(quad.subject),
        namedNode(quad.predicate),
        literal(quad.object),
      );
    }

    const item = {
      uri: String(identifier),
      identifier,
      subjectUri, // JSON-LD @id for query matching
      quads, // Persist the quads so they can be restored during loadData()
    };

    // Store item in the map using URI as key
    this.#index.set(item.uri, item);

    // Append item to storage as JSON-ND line
    await this.#storage.append(this.#indexKey, JSON.stringify(item));
  }

  /**
   * Gets an item by its resource ID
   * @param {string} id - The resource ID to retrieve
   * @returns {Promise<resource.Identifier|null>} The item identifier, or null if not found
   */
  async getItem(id) {
    if (!this.#loaded) await this.loadData();
    const item = this.#index.get(id);
    return item ? item.identifier : null;
  }

  /**
   * Checks if an item with the given ID exists in the index
   * @param {string} id - The ID to check for
   * @returns {Promise<boolean>} True if item exists, false otherwise
   */
  async hasItem(id) {
    if (!this.#loaded) await this.loadData();
    return this.#index.has(id);
  }

  /**
   * Loads graph data from disk
   * @returns {Promise<void>}
   */
  async loadData() {
    // Check if the index file exists before trying to read it
    if (!(await this.#storage.exists(this.#indexKey))) {
      this.#index.clear();
      this.#store.removeMatches();
      this.#loaded = true;
      return;
    }

    const items = await this.#storage.get(this.#indexKey);
    const parsedItems = Array.isArray(items) ? items : [];

    for (const item of parsedItems) {
      this.#index.set(item.uri, item);

      // Add quads to N3 store if they exist
      if (item.quads && Array.isArray(item.quads)) {
        for (const quad of item.quads) {
          this.#store.addQuad(
            namedNode(quad.subject),
            namedNode(quad.predicate),
            literal(quad.object),
          );
        }
      }
    }

    this.#loaded = true;
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
   * @param {Set<string>} matchingSubjects - Set of subject URIs that matched the query
   * @returns {resource.Identifier[]} Array of resource identifiers
   * @private
   */
  #findMatchingIdentifiers(matchingSubjects) {
    const identifiers = [];
    for (const item of this.#index.values()) {
      if (item.subjectUri && matchingSubjects.has(item.subjectUri)) {
        identifiers.push(resource.Identifier.fromObject(item.identifier));
      }
    }
    return identifiers;
  }

  /**
   * Queries items from this graph index using SPARQL-like patterns
   * @param {object} pattern - Query pattern with subject, predicate, object (wildcards converted to null)
   * @returns {Promise<resource.Identifier[]>} Array of resource identifiers
   */
  async queryItems(pattern) {
    if (!this.#loaded) await this.loadData();

    const normalizedPattern = this.#normalizePattern(pattern);

    // Query the N3 store for matching triples
    const quads = this.#store.getQuads(
      normalizedPattern.subject ? namedNode(normalizedPattern.subject) : null,
      normalizedPattern.predicate
        ? namedNode(normalizedPattern.predicate)
        : null,
      normalizedPattern.object ? literal(normalizedPattern.object) : null,
    );

    if (quads.length === 0) {
      return [];
    }

    // Collect all subjects that match the pattern
    const matchingSubjects = new Set();
    for (const quad of quads) {
      matchingSubjects.add(quad.subject.value);
    }

    return this.#findMatchingIdentifiers(matchingSubjects);
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
