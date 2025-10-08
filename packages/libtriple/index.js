/* eslint-env node */

import { Store, DataFactory } from "n3";
import { resource } from "@copilot-ld/libtype";

const { namedNode, literal } = DataFactory;

/**
 * TripleIndex class for managing RDF triple data with lazy loading
 */
export class TripleIndex {
  #storage;
  #store;
  #indexKey;
  #index = new Map();
  #loaded = false;

  /**
   * Creates a new TripleIndex instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage interface for data operations
   * @param {Store} store - N3 Store instance for triple operations
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
   * Loads triple data from disk
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
   * Queries items from this triple index using SPARQL-like patterns
   * @param {object} pattern - Query pattern with subject, predicate, object (null for wildcards)
   * @returns {Promise<resource.Identifier[]>} Array of resource identifiers
   */
  async queryItems(pattern) {
    if (!this.#loaded) await this.loadData();

    const identifiers = [];

    // Query the N3 store for matching triples
    const quads = this.#store.getQuads(
      pattern.subject ? namedNode(pattern.subject) : null,
      pattern.predicate ? namedNode(pattern.predicate) : null,
      pattern.object ? literal(pattern.object) : null,
    );

    // If we have matching quads, find the corresponding items by subject
    if (quads.length > 0) {
      const matchingSubjects = new Set();

      // Collect all subjects that match the pattern
      for (const quad of quads) {
        matchingSubjects.add(quad.subject.value);
      }

      // Find items whose subjectUri matches the matching subjects
      for (const item of this.#index.values()) {
        // Check if this item's subjectUri is one of our matching subjects
        if (item.subjectUri && matchingSubjects.has(item.subjectUri)) {
          identifiers.push(resource.Identifier.fromObject(item.identifier));
        }
      }
    }

    return identifiers;
  }
}

/**
 * Parses a space-delimited triple query line into a pattern object
 * @param {string} line - Query line in format: <subject> <predicate> <object>
 * @returns {object} Pattern object with subject, predicate, object (null for wildcards)
 * @example
 * parseTripleQuery('person:john ? ?') // { subject: 'person:john', predicate: null, object: null }
 * parseTripleQuery('? foaf:name "John Doe"') // { subject: null, predicate: 'foaf:name', object: 'John Doe' }
 * parseTripleQuery('person:john type "Person"') // { subject: 'person:john', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'Person' }
 */
export function parseTripleQuery(line) {
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

  // Helper function to parse RDF terms
  const parseTerm = (value) => (value === "?" ? null : value);

  return {
    subject: parseTerm(subject),
    predicate: parseTerm(
      predicate === "type"
        ? "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        : predicate,
    ),
    object: parseTerm(
      object?.startsWith('"') && object.endsWith('"')
        ? object.slice(1, -1)
        : object,
    ),
  };
}

export { TripleProcessor } from "./processor.js";
