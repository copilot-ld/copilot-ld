/* eslint-env node */

/**
 * LLM-based type normalization and schema enrichment utilities
 * Used by OntologyProcessor for top-down ontology generation
 */

import {
  getSchemaDefinition,
  hasSchemaDefinition,
  addSchemaDefinition,
} from "../schema.js";

/**
 * Extracts local name from IRI
 * @param {string} iri - Full IRI
 * @returns {string} Local name
 */
function extractLocalName(iri) {
  const parts = iri.split(/[#/]/);
  return parts[parts.length - 1] || iri;
}

/**
 * Build LLM prompt for type normalization
 * @param {string} localName - Local name of the type
 * @param {string[]} propNames - Sample property names
 * @returns {string} Prompt string
 */
function buildNormalizationPrompt(localName, propNames) {
  return `Type name: "${localName}"
Properties: ${propNames.length > 0 ? propNames.join(", ") : "none"}

Task: Map this to a canonical Schema.org type if applicable.

Common patterns:
- Individual/Person → https://schema.org/Person
- Corporation/Company → https://schema.org/Organization
- App/Application → https://schema.org/SoftwareApplication

CRITICAL: Return ONLY valid JSON:
{"canonical": "https://schema.org/TypeName"}  // if it maps
{"canonical": null}  // if already canonical or truly unknown`;
}

/**
 * Parse LLM response content
 * @param {object} response - LLM response
 * @returns {object|null} Parsed JSON or null
 */
function parseLLMResponse(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (!content) return null;

  const text = content.text || content || "";
  if (!text) return null;

  const clean = text
    .replace(/```json\n?/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(clean);
}

/**
 * Normalize a single type via LLM
 * @param {object} llm - LLM instance
 * @param {string} typeIRI - Type IRI
 * @param {string[]} propNames - Sample property names
 * @param {Function} log - Logger function
 * @returns {Promise<string|null>} Canonical type IRI or null
 */
export async function normalizeType(llm, typeIRI, propNames, log) {
  const localName = extractLocalName(typeIRI);
  const prompt = buildNormalizationPrompt(localName, propNames);

  try {
    const response = await llm.createCompletions({
      messages: [
        {
          role: "system",
          content: "You are a Schema.org expert. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const result = parseLLMResponse(response);
    if (result?.canonical) {
      log(
        "info",
        `Mapped: ${localName} → ${extractLocalName(result.canonical)}`,
      );
      return result.canonical;
    }
  } catch (error) {
    log("error", `Error normalizing ${localName}: ${error.message}`);
  }
  return null;
}

/**
 * Enrich schema definitions for unknown types via LLM
 * @param {object} llm - LLM instance
 * @param {Set<string>} unknownTypes - Set of unknown type IRIs
 * @param {Record<string, object>} schemaDefinitions - Schema definitions object
 * @param {Function} log - Logger function
 * @returns {Promise<number>} Number of schemas added
 */
export async function enrichSchemas(llm, unknownTypes, schemaDefinitions, log) {
  const typeNames = Array.from(unknownTypes).map(extractLocalName);
  if (typeNames.length === 0) return 0;

  const prompt = `Which of these types are valid Schema.org types?
Types: ${typeNames.join(", ")}

For ONLY the valid Schema.org types, return their expected properties.

Return ONLY valid JSON in this compact format (short names, no prefixes):
{
  "JobPosting": {
    "title": "Text",
    "datePosted": "Date",
    "hiringOrganization": "Organization"
  }
}

If none are valid Schema.org types, return: {}`;

  try {
    const response = await llm.createCompletions({
      messages: [
        {
          role: "system",
          content: "You are a Schema.org expert. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const enriched = parseLLMResponse(response) || {};
    let addedCount = 0;

    for (const [typeIRI, props] of Object.entries(enriched)) {
      if (!hasSchemaDefinition(schemaDefinitions, typeIRI)) {
        // Wrap props in new format structure
        const typeDef = { aliases: [], examples: [], props };
        addSchemaDefinition(schemaDefinitions, typeIRI, typeDef);
        unknownTypes.delete(typeIRI);
        addedCount++;
        log("info", `Added schema for ${extractLocalName(typeIRI)}`);
      }
    }

    return addedCount;
  } catch (error) {
    log("error", `Error enriching schemas: ${error.message}`);
    return 0;
  }
}

/**
 * Validate schema usage and collect issues
 * @param {Map<string, Set<string>>} typeInstances - Type instances map
 * @param {Map<string, Map<string, Set<string>>>} typeProperties - Type properties map
 * @param {Record<string, object>} schemaDefinitions - Schema definitions
 * @param {Function} log - Logger function
 */
export function validateSchemas(
  typeInstances,
  typeProperties,
  schemaDefinitions,
  log,
) {
  const issues = [];

  for (const [typeIRI] of typeInstances.entries()) {
    const schemaDef = getSchemaDefinition(schemaDefinitions, typeIRI);
    if (!schemaDef?.props) continue;

    const schemaProps = new Set(Object.keys(schemaDef.props));
    const observedProps = typeProperties.get(typeIRI);
    const observedPropSet = observedProps
      ? new Set(observedProps.keys())
      : new Set();

    const missing = Array.from(schemaProps).filter(
      (p) => !observedPropSet.has(p),
    );
    const extra = Array.from(observedPropSet).filter(
      (p) => !schemaProps.has(p),
    );

    if (missing.length > 0 || extra.length > 0) {
      issues.push({
        type: extractLocalName(typeIRI),
        missing: missing.map(extractLocalName),
        extra: extra.map(extractLocalName),
      });
    }
  }

  if (issues.length === 0) {
    log("info", "No schema validation issues found");
    return;
  }

  log("info", `Found ${issues.length} types with schema variations`);
  for (const issue of issues.slice(0, 5)) {
    log("info", `  ${issue.type}:`);
    if (issue.missing.length > 0)
      log("info", `    Missing: ${issue.missing.join(", ")}`);
    if (issue.extra.length > 0)
      log("info", `    Extra: ${issue.extra.join(", ")}`);
  }
}

/**
 * @typedef {object} SynonymMerge
 * @property {string} canonical - Canonical entity name
 * @property {string[]} aliases - Alias names that should merge to canonical
 * @property {number} confidence - Confidence score (0-1)
 */

/**
 * @typedef {object} SynonymResult
 * @property {string} typeIRI - Type IRI
 * @property {SynonymMerge[]} merges - Synonym merges for this type
 */

const BATCH_SIZE = 50;

/**
 * Detect synonyms among entities of a given type via LLM
 * @param {object} llm - LLM instance
 * @param {string} typeName - Type name (short)
 * @param {string[]} entities - Entity names
 * @param {Function} log - Logger function
 * @returns {Promise<SynonymMerge[]>} Detected synonym merges
 */
export async function detectSynonyms(llm, typeName, entities, log) {
  if (entities.length < 2) return [];

  const allMerges = [];

  // Process in batches
  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);
    const prompt = `Analyze these ${typeName} entities and identify synonyms/aliases:

Entities:
${batch.map((e) => `- "${e}"`).join("\n")}

Find entities that refer to the same real-world thing.
Examples of synonyms:
- "John Smith" and "J. Smith" (same person)
- "Pfizer Inc." and "Pfizer" (same organization)
- "COVID-19" and "SARS-CoV-2" (same disease)

Return ONLY valid JSON:
{"merges": [{"canonical": "Full Name", "aliases": ["Abbreviation"], "confidence": 0.9}]}

Rules:
- Only include merges with confidence >= 0.8
- canonical should be the most complete/formal name
- Return empty merges array if no synonyms found: {"merges": []}`;

    try {
      const response = await llm.createCompletions({
        messages: [
          {
            role: "system",
            content:
              "You are an entity resolution expert. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = parseLLMResponse(response);
      if (result?.merges?.length > 0) {
        allMerges.push(...result.merges);
        log(
          "info",
          `Found ${result.merges.length} synonym merges for ${typeName}`,
        );
      }
    } catch (error) {
      log(
        "error",
        `Error detecting synonyms for ${typeName}: ${error.message}`,
      );
    }
  }

  return allMerges;
}

/**
 * Update schema definitions with discovered examples and synonyms
 * @param {Record<string, object>} schemaDefinitions - Schema definitions (mutated)
 * @param {Map<string, Set<string>>} typeExamples - Type IRI to example names
 * @param {SynonymResult[]} synonymResults - Synonym detection results
 * @param {Function} log - Logger function
 */
export function updateSchemaWithDiscoveries(
  schemaDefinitions,
  typeExamples,
  synonymResults,
  log,
) {
  // Add examples to schema definitions (entity names, not including merged aliases)
  // We only add canonical names, not the alias names that get merged
  for (const [typeIRI, examples] of typeExamples.entries()) {
    const shortName = typeIRI.replace("https://schema.org/", "");
    const def = schemaDefinitions[shortName];
    if (!def) continue;

    // Find all alias names for this type that should be excluded
    const aliasNames = new Set();
    const typeResult = synonymResults.find((r) => r.typeIRI === typeIRI);
    if (typeResult) {
      for (const merge of typeResult.merges) {
        for (const alias of merge.aliases) {
          aliasNames.add(alias);
        }
      }
    }

    // Only add canonical examples (not aliases)
    const existingExamples = new Set(def.examples || []);
    for (const example of examples) {
      if (!aliasNames.has(example)) {
        existingExamples.add(example);
      }
    }
    def.examples = Array.from(existingExamples).slice(0, 10);
  }

  // Note: Type aliases (like Individual → Person, Corporation → Organization)
  // are added during type normalization in ontology.js, not from entity synonyms.
  // Entity synonyms (like "J. Smith" → "Dr. John Smith") are used for entity
  // merging only and should NOT be added as type aliases.

  log("debug", "Updated schema definitions with discovered examples");
}

export { extractLocalName };
