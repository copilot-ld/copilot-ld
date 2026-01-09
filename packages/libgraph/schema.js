/* eslint-env node */

/**
 * Schema.org Type Definitions Utilities
 *
 * Loads and manages Schema.org vocabulary knowledge for top-down ontology generation.
 * Schema definitions are loaded from data/schemas/schema-definitions.json.
 *
 * Schema format:
 * { "Person": { "aliases": [...], "examples": [...], "props": { "name": "Text" } } }
 *
 * Helper functions handle IRI expansion/contraction.
 */

import { createStorage } from "@copilot-ld/libstorage";

const SCHEMA_PREFIX = "https://schema.org/";

/**
 * @typedef {object} SchemaTypeDefinition
 * @property {string[]} [aliases] - Alternative names/synonyms for this type
 * @property {string[]} [examples] - Example entity names of this type
 * @property {Record<string, string>} props - Property definitions (propName: range)
 */

/** @type {Record<string, SchemaTypeDefinition> | null} */
let cachedDefinitions = null;

/**
 * Extract short name from full IRI or return as-is if already short
 * @param {string} iri - Full IRI or short name
 * @returns {string} Short name
 */
export function toShortName(iri) {
  return iri.replace(SCHEMA_PREFIX, "");
}

/**
 * Expand short name to full Schema.org IRI
 * @param {string} shortName - Short name or already full IRI
 * @returns {string} Full IRI
 */
export function toFullIRI(shortName) {
  if (shortName.startsWith("http")) return shortName;
  return SCHEMA_PREFIX + shortName;
}

/**
 * Load schema definitions from storage
 * Results are cached for subsequent calls
 * @returns {Promise<Record<string, SchemaTypeDefinition>>} Schema definitions object
 */
export async function loadSchemaDefinitions() {
  if (cachedDefinitions) {
    return cachedDefinitions;
  }

  const storage = createStorage("schemas");
  cachedDefinitions = await storage.get("schema-definitions.json");
  return cachedDefinitions;
}

/**
 * Save schema definitions to storage
 * @param {Record<string, SchemaTypeDefinition>} definitions - Schema definitions to save
 * @returns {Promise<void>}
 */
export async function saveSchemaDefinitions(definitions) {
  const storage = createStorage("schemas");
  await storage.put("schema-definitions.json", definitions);
  cachedDefinitions = definitions;
}

/**
 * Get schema definition for a type (accepts full IRI or short name)
 * @param {Record<string, SchemaTypeDefinition>} definitions - Schema definitions
 * @param {string} typeIRI - Schema.org type IRI or short name
 * @returns {SchemaTypeDefinition|null} Type definition or null if not found
 */
export function getSchemaDefinition(definitions, typeIRI) {
  const shortName = toShortName(typeIRI);
  return definitions[shortName] || null;
}

/**
 * Get properties map from a schema definition
 * @param {SchemaTypeDefinition|null} definition - Schema type definition
 * @returns {Record<string, string>} Properties map (propName: range)
 */
export function getProps(definition) {
  return definition?.props || {};
}

/**
 * Check if a type has a schema definition (accepts full IRI or short name)
 * @param {Record<string, SchemaTypeDefinition>} definitions - Schema definitions
 * @param {string} typeIRI - Type IRI or short name to check
 * @returns {boolean} True if schema definition exists
 */
export function hasSchemaDefinition(definitions, typeIRI) {
  const shortName = toShortName(typeIRI);
  return shortName in definitions;
}

/**
 * Add a schema definition at runtime (for LLM enrichment)
 * @param {Record<string, SchemaTypeDefinition>} definitions - Schema definitions (mutated)
 * @param {string} typeIRI - Type IRI or short name to add
 * @param {SchemaTypeDefinition} definition - Type definition to add
 */
export function addSchemaDefinition(definitions, typeIRI, definition) {
  const shortName = toShortName(typeIRI);
  definitions[shortName] = definition;
}

/**
 * Merge new aliases into a schema definition (deduplicates)
 * @param {SchemaTypeDefinition} definition - Schema definition to update (mutated)
 * @param {string[]} newAliases - New aliases to add
 */
export function mergeAliases(definition, newAliases) {
  const aliasSet = new Set(definition.aliases || []);
  for (const alias of newAliases) {
    aliasSet.add(alias);
  }
  definition.aliases = Array.from(aliasSet).sort();
}

/**
 * Add examples to a schema definition (deduplicates, limits count)
 * @param {SchemaTypeDefinition} definition - Schema definition to update (mutated)
 * @param {string[]} newExamples - New examples to add
 * @param {number} [maxExamples] - Maximum number of examples to keep (default: 10)
 */
export function addExamples(definition, newExamples, maxExamples = 10) {
  const exampleSet = new Set(definition.examples || []);
  for (const example of newExamples) {
    exampleSet.add(example);
  }
  definition.examples = Array.from(exampleSet).slice(0, maxExamples);
}

/**
 * Get all defined Schema.org type names
 * @param {Record<string, SchemaTypeDefinition>} definitions - Schema definitions
 * @returns {string[]} Array of type short names
 */
export function getDefinedTypes(definitions) {
  return Object.keys(definitions);
}

/**
 * Clear the cached definitions (useful for testing)
 */
export function clearSchemaCache() {
  cachedDefinitions = null;
}
