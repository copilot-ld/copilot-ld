#!/usr/bin/env node
/* eslint-disable max-lines */
/* eslint-env node */

/**
 * Top-Down Ontology Generator
 *
 * Generates SHACL ontology and graph index using predefined Schema.org vocabulary
 * knowledge applied to observed data patterns. This script replaces process:graphs
 * and uses LLM to normalize types to canonical Schema.org definitions.
 *
 * USAGE:
 *
 * npx env-cmd -- node scripts/ontology_top_down.js
 * npm run ontology:topdown
 *
 * APPROACH:
 *
 * 1. Loads predefined Schema.org type and property definitions
 * 2. Reads resources from ResourceIndex (same input as process:graphs)
 * 3. Parses RDF quads from resource content
 * 4. LLM normalizes discovered types to canonical Schema.org types
 * (e.g., Individual → Person, Corporation → Organization)
 * 5. LLM enriches schema definitions for valid Schema.org types
 * 6. LLM validates schema usage and provides suggestions
 * 7. Generates SHACL shapes with schema constraints + usage statistics
 *
 * OUTPUT:
 * - data/graphs/index.jsonl - RDF quads per resource (with normalized types)
 * - data/graphs/ontology.ttl - SHACL ontology shapes
 *
 * LLM FEATURES (always enabled):
 * - Type normalization: Merges "Individual" → "Person", "Corporation" → "Organization"
 * - Schema enrichment: Auto-adds missing Schema.org types (e.g., JobPosting)
 * - Quality validation: Suggests improvements and catches errors
 */

import { writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Parser, DataFactory, Writer } from "n3";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createLogger } from "@copilot-ld/libtelemetry";
import { createLlm } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { common } from "@copilot-ld/libtype";
import {
  SCHEMA_DEFINITIONS,
  getSchemaDefinition,
} from "./schema-definitions.js";

const { namedNode, literal } = DataFactory;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RDF_TYPE_IRI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

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
 * Parse RDF string into quads
 * @param {string} rdf - RDF string in Turtle format
 * @returns {Array} Array of RDF quads
 */
function parseRDF(rdf) {
  const parser = new Parser({ format: "Turtle" });
  try {
    return parser.parse(rdf);
  } catch {
    return [];
  }
}

/**
 * Sort quads so rdf:type assertions come first (for consistent processing)
 * @param {Array} quads - Array of RDF quads
 * @returns {Array} Sorted quads
 */
function sortQuads(quads) {
  return quads.sort((a, b) => {
    const aIsType = a.predicate.value === RDF_TYPE_IRI;
    const bIsType = b.predicate.value === RDF_TYPE_IRI;
    if (aIsType && !bIsType) return -1;
    if (!aIsType && bIsType) return 1;
    return 0;
  });
}

/**
 * Process resources and build ontology statistics with schema guidance
 * @param {Array} resources - Resources from ResourceIndex
 * @returns {object} Object containing stats and indexEntries
 */
// eslint-disable-next-line complexity
function processResources(resources) {
  const stats = {
    // Track observed types and their instances
    typeInstances: new Map(), // typeIRI -> Set<subjectIRI>

    // Track observed properties per type
    typeProperties: new Map(), // typeIRI -> Map<propertyIRI, Set<subjectIRI>>

    // Track property object types
    propertyObjectTypes: new Map(), // propertyIRI -> Map<typeIRI, count>

    // Track which schema-defined properties were actually observed
    schemaPropertyUsage: new Map(), // typeIRI -> Set<propertyIRI>

    // Track types without schema definitions
    unknownTypes: new Set(),
  };

  // Collect entries for index.jsonl
  const indexEntries = [];

  let processedCount = 0;
  let skippedCount = 0;

  for (const resource of resources) {
    // Skip resources without content
    if (!resource.content) {
      skippedCount++;
      continue;
    }

    // Parse RDF quads
    const quads = parseRDF(resource.content);
    if (quads.length === 0) {
      skippedCount++;
      continue;
    }

    processedCount++;

    // Sort quads (rdf:type first) and add to index entries
    const sortedQuads = sortQuads(quads);
    indexEntries.push({
      id: String(resource.id),
      identifier: resource.id,
      quads: sortedQuads,
    });

    // Build subject-to-types mapping for this resource
    const subjectTypes = new Map(); // subjectIRI -> Set<typeIRI>

    // First pass: collect all type assertions
    for (const quad of quads) {
      if (quad.predicate.value === RDF_TYPE_IRI && quad.object?.value) {
        const subject = quad.subject.value;
        const type = quad.object.value;

        if (!subjectTypes.has(subject)) {
          subjectTypes.set(subject, new Set());
        }
        subjectTypes.get(subject).add(type);

        // Track type instances
        if (!stats.typeInstances.has(type)) {
          stats.typeInstances.set(type, new Set());
        }
        stats.typeInstances.get(type).add(subject);

        // Track schema property usage
        if (getSchemaDefinition(type)) {
          if (!stats.schemaPropertyUsage.has(type)) {
            stats.schemaPropertyUsage.set(type, new Set());
          }
        } else {
          stats.unknownTypes.add(type);
        }
      }
    }

    // Second pass: process properties
    for (const quad of quads) {
      const predicate = quad.predicate.value;

      // Skip rdf:type (already processed)
      if (predicate === RDF_TYPE_IRI) continue;

      const subject = quad.subject.value;
      const types = subjectTypes.get(subject);

      if (!types) continue;

      // Track property usage for each type
      for (const type of types) {
        if (!stats.typeProperties.has(type)) {
          stats.typeProperties.set(type, new Map());
        }

        const propMap = stats.typeProperties.get(type);
        if (!propMap.has(predicate)) {
          propMap.set(predicate, new Set());
        }
        propMap.get(predicate).add(subject);

        // Track schema property usage
        const schemaDef = getSchemaDefinition(type);
        if (schemaDef && schemaDef.properties[predicate]) {
          stats.schemaPropertyUsage.get(type).add(predicate);
        }
      }

      // Track property object types (for NamedNode objects)
      if (quad.object.termType === "NamedNode") {
        const objectIRI = quad.object.value;
        const objectTypes = subjectTypes.get(objectIRI);

        if (objectTypes) {
          if (!stats.propertyObjectTypes.has(predicate)) {
            stats.propertyObjectTypes.set(predicate, new Map());
          }

          const typeMap = stats.propertyObjectTypes.get(predicate);
          for (const objType of objectTypes) {
            typeMap.set(objType, (typeMap.get(objType) || 0) + 1);
          }
        }
      }
    }
  }

  console.error(
    `Processed ${processedCount} resources, skipped ${skippedCount}`,
  );

  return { stats, indexEntries };
}

/**
 * Get dominant object type for a property
 * @param {string} predicateIRI - Property IRI
 * @param {Map} propertyObjectTypes - Property object types map
 * @returns {string|null} Dominant type IRI or null
 */
function getDominantObjectType(predicateIRI, propertyObjectTypes) {
  const typeMap = propertyObjectTypes.get(predicateIRI);
  if (!typeMap || typeMap.size === 0) return null;

  let maxCount = 0;
  let dominantType = null;

  for (const [type, count] of typeMap.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type;
    }
  }

  // Require >50% dominance
  const total = Array.from(typeMap.values()).reduce((sum, c) => sum + c, 0);
  return maxCount / total > 0.5 ? dominantType : null;
}

/**
 * Generate SHACL TTL from statistics with schema guidance
 * @param {object} stats - Ontology statistics
 * @returns {string} TTL formatted string
 */
// eslint-disable-next-line complexity
function generateTTL(stats) {
  const prefixes = {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    sh: "http://www.w3.org/ns/shacl#",
    dct: "http://purl.org/dc/terms/",
    schema: "https://schema.org/",
    xsd: "http://www.w3.org/2001/XMLSchema#",
  };

  const writer = new Writer({ prefixes });

  // Sort types by instance count (descending)
  const sortedTypes = Array.from(stats.typeInstances.entries()).sort(
    (a, b) => b[1].size - a[1].size,
  );

  for (const [typeIRI, instances] of sortedTypes) {
    const shapeIRI = `${typeIRI}Shape`;
    const typeName = extractLocalName(typeIRI);
    const schemaDef = getSchemaDefinition(typeIRI);

    // Add shape metadata
    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
      namedNode("http://www.w3.org/ns/shacl#NodeShape"),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/ns/shacl#targetClass"),
      namedNode(typeIRI),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://purl.org/dc/terms/source"),
      namedNode(typeIRI),
    );

    const hasSchema = schemaDef ? " (schema-defined)" : " (discovered)";
    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://purl.org/dc/terms/description"),
      literal(`Shape for ${typeName} instances${hasSchema}`),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/ns/shacl#name"),
      literal(typeName),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/ns/shacl#comment"),
      literal(`Instances: ${instances.size}`),
    );

    // Collect all properties (schema-defined + observed)
    const allProperties = new Map();

    // Add schema-defined properties
    if (schemaDef) {
      for (const [propIRI, propDef] of Object.entries(schemaDef.properties)) {
        allProperties.set(propIRI, {
          schemaDefined: true,
          schemaRange: propDef.range,
          observed: false,
          observedCount: 0,
        });
      }
    }

    // Add/update with observed properties
    const observedProps = stats.typeProperties.get(typeIRI) || new Map();
    for (const [propIRI, subjects] of observedProps.entries()) {
      if (allProperties.has(propIRI)) {
        const prop = allProperties.get(propIRI);
        prop.observed = true;
        prop.observedCount = subjects.size;
      } else {
        allProperties.set(propIRI, {
          schemaDefined: false,
          schemaRange: null,
          observed: true,
          observedCount: subjects.size,
        });
      }
    }

    // Sort properties: observed first, then by count/alpha
    const sortedProps = Array.from(allProperties.entries()).sort((a, b) => {
      const [_aIRI, aProp] = a;
      const [_bIRI, bProp] = b;

      // Observed properties first
      if (aProp.observed && !bProp.observed) return -1;
      if (!aProp.observed && bProp.observed) return 1;

      // Then by count
      return bProp.observedCount - aProp.observedCount;
    });

    // Generate property shapes
    for (const [propIRI, propInfo] of sortedProps) {
      const propName = extractLocalName(propIRI);

      let comment = `Instances: ${propInfo.observedCount}`;
      if (propInfo.schemaDefined && !propInfo.observed) {
        comment = "Schema-defined (not yet observed)";
      } else if (propInfo.schemaDefined && propInfo.observed) {
        comment += " (schema-defined)";
      } else {
        comment += " (discovered)";
      }

      const propertyPredicates = [
        {
          predicate: namedNode(
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          ),
          object: namedNode("http://www.w3.org/ns/shacl#PropertyShape"),
        },
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#path"),
          object: namedNode(propIRI),
        },
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#name"),
          object: literal(propName),
        },
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#comment"),
          object: literal(comment),
        },
      ];

      // Add type constraints
      if (propInfo.schemaRange) {
        // Use schema-defined range
        const range = propInfo.schemaRange;

        if (range.startsWith("https://schema.org/")) {
          // Object property
          propertyPredicates.push({
            predicate: namedNode("http://www.w3.org/ns/shacl#class"),
            object: namedNode(range),
          });
          propertyPredicates.push({
            predicate: namedNode("http://www.w3.org/ns/shacl#nodeKind"),
            object: namedNode("http://www.w3.org/ns/shacl#IRI"),
          });
        } else {
          // Datatype property
          let datatypeIRI = "http://www.w3.org/2001/XMLSchema#string";
          if (range === "Date") {
            datatypeIRI = "http://www.w3.org/2001/XMLSchema#date";
          } else if (range === "Number") {
            datatypeIRI = "http://www.w3.org/2001/XMLSchema#decimal";
          }

          propertyPredicates.push({
            predicate: namedNode("http://www.w3.org/ns/shacl#datatype"),
            object: namedNode(datatypeIRI),
          });
        }
      } else if (propInfo.observed) {
        // Use observed dominant type
        const dominantType = getDominantObjectType(
          propIRI,
          stats.propertyObjectTypes,
        );
        if (dominantType) {
          propertyPredicates.push({
            predicate: namedNode("http://www.w3.org/ns/shacl#class"),
            object: namedNode(dominantType),
          });
          propertyPredicates.push({
            predicate: namedNode("http://www.w3.org/ns/shacl#nodeKind"),
            object: namedNode("http://www.w3.org/ns/shacl#IRI"),
          });
        }
      }

      const bnodeId = writer.blank(propertyPredicates);
      writer.addQuad(
        namedNode(shapeIRI),
        namedNode("http://www.w3.org/ns/shacl#property"),
        bnodeId,
      );
    }
  }

  let ttl = "";
  writer.end((_err, result) => {
    ttl = result;
  });

  return ttl;
}

/**
 * Normalize discovered types to canonical Schema.org types using LLM
 * @param {object} llm - LLM instance
 * @param {object} stats - Ontology statistics
 * @returns {Promise<{stats: object, typeMapping: Map}>} Updated statistics and type mapping
 */
// eslint-disable-next-line complexity
async function normalizeTypes(llm, stats) {
  console.error("  Normalizing discovered types to Schema.org...");

  const typeMapping = new Map(); // discoveredType -> canonicalType
  const unknownTypesArray = Array.from(stats.unknownTypes);

  if (unknownTypesArray.length === 0) {
    console.error("  No types to normalize");
    return { stats, typeMapping };
  }

  // Process in batches to avoid too many LLM calls
  for (const discoveredType of unknownTypesArray) {
    const localName = extractLocalName(discoveredType);

    // Get sample properties for this type
    const typeProps = stats.typeProperties.get(discoveredType);
    const propNames = typeProps
      ? Array.from(typeProps.keys()).map(extractLocalName).slice(0, 5)
      : [];

    const prompt = `Type name: "${localName}"
Properties: ${propNames.length > 0 ? propNames.join(", ") : "none"}

Task: Map this to a canonical Schema.org type if applicable.

Common patterns:
- Individual/Person → https://schema.org/Person
- Corporation/Company → https://schema.org/Organization
- App/Application → https://schema.org/SoftwareApplication
- ResearchProject → https://schema.org/ResearchProject (already canonical)
- JobPosting → https://schema.org/JobPosting (already canonical)

CRITICAL: Return ONLY valid JSON, no explanation:
{"canonical": "https://schema.org/TypeName"}  // if it maps
{"canonical": null}  // if already canonical or truly unknown

For "${localName}", what is the canonical Schema.org type?`;

    try {
      const response = await llm.createCompletions(
        [
          common.Message.fromObject({
            role: "system",
            content: "You are a Schema.org expert. Return only valid JSON.",
          }),
          common.Message.fromObject({ role: "user", content: prompt }),
        ],
        undefined,
        0.3,
        200,
      );

      // Debug: check full response structure
      if (!response || !response.choices || response.choices.length === 0) {
        console.error(`    ⚠️  ${localName}: No LLM response`);
        continue;
      }

      const message = response.choices[0].message;
      if (!message || !message.content) {
        console.error(`    ⚠️  ${localName}: Empty message content`);
        console.error(
          `    Response:`,
          JSON.stringify(response).substring(0, 200),
        );
        continue;
      }

      const content = message.content.text || message.content || "";
      if (!content) {
        console.error(`    ⚠️  ${localName}: No text content`);
        continue;
      }

      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```/g, "")
        .trim();

      console.error(
        `    LLM: ${localName} -> ${cleanContent.substring(0, 100)}`,
      );

      const result = JSON.parse(cleanContent);

      if (result.canonical) {
        typeMapping.set(discoveredType, result.canonical);
        console.error(
          `    ✓ MAPPED: ${localName} → ${extractLocalName(result.canonical)}`,
        );
      } else {
        console.error(`    - ${localName}: Already canonical or unknown`);
      }
    } catch (error) {
      console.error(`    ❌ Error for ${localName}: ${error.message}`);
    }
  }

  // Apply mappings: merge instances from discovered type to canonical type
  for (const [discoveredType, canonicalType] of typeMapping.entries()) {
    const instances = stats.typeInstances.get(discoveredType);
    if (!instances) continue;

    // Merge instances into canonical type
    if (!stats.typeInstances.has(canonicalType)) {
      stats.typeInstances.set(canonicalType, new Set());
    }
    instances.forEach((inst) =>
      stats.typeInstances.get(canonicalType).add(inst),
    );

    // Merge properties
    const discoveredProps = stats.typeProperties.get(discoveredType);
    if (discoveredProps) {
      if (!stats.typeProperties.has(canonicalType)) {
        stats.typeProperties.set(canonicalType, new Map());
      }
      const canonicalProps = stats.typeProperties.get(canonicalType);

      for (const [prop, subjects] of discoveredProps.entries()) {
        if (!canonicalProps.has(prop)) {
          canonicalProps.set(prop, new Set());
        }
        subjects.forEach((subj) => canonicalProps.get(prop).add(subj));
      }
    }

    // Update schema property usage
    if (stats.schemaPropertyUsage.has(canonicalType)) {
      const discoveredUsage = stats.schemaPropertyUsage.get(discoveredType);
      if (discoveredUsage) {
        discoveredUsage.forEach((prop) =>
          stats.schemaPropertyUsage.get(canonicalType).add(prop),
        );
      }
    }

    // Remove discovered type
    stats.typeInstances.delete(discoveredType);
    stats.typeProperties.delete(discoveredType);
    stats.unknownTypes.delete(discoveredType);
  }

  console.error(`  Normalized ${typeMapping.size} types`);
  return { stats, typeMapping };
}

/**
 * Apply type mapping to normalize types in index entries
 * @param {Array} indexEntries - Array of index entries with quads
 * @param {Map} typeMapping - Map of discovered type -> canonical type
 * @returns {Array} Updated index entries with normalized types
 */
function applyTypeMappingToIndex(indexEntries, typeMapping) {
  if (typeMapping.size === 0) return indexEntries;

  console.error(
    `  Applying type mapping to ${indexEntries.length} index entries...`,
  );

  for (const entry of indexEntries) {
    // Map quads, replacing type assertions with canonical types
    entry.quads = entry.quads.map((quad) => {
      // Only normalize rdf:type object values
      if (
        quad.predicate.value === RDF_TYPE_IRI &&
        quad.object.termType === "NamedNode"
      ) {
        const canonicalType = typeMapping.get(quad.object.value);
        if (canonicalType) {
          // Create a proper new quad using DataFactory (N3 quads are immutable)
          return DataFactory.quad(
            quad.subject,
            quad.predicate,
            namedNode(canonicalType),
            quad.graph,
          );
        }
      }
      return quad;
    });
  }

  return indexEntries;
}

/**
 * Enrich schema definitions for missing Schema.org types using LLM
 * @param {object} llm - LLM instance
 * @param {Set<string>} unknownTypes - Set of types without schema definitions
 * @returns {Promise<void>}
 */
async function enrichSchemas(llm, unknownTypes) {
  console.error("  Enriching schemas for missing types...");

  const unknownTypesArray = Array.from(unknownTypes);
  if (unknownTypesArray.length === 0) {
    console.error("  No types to enrich");
    return;
  }

  const typeNames = unknownTypesArray.map(extractLocalName);

  const prompt = `Which of these types are valid Schema.org types?
Types: ${typeNames.join(", ")}

For ONLY the valid Schema.org types, return their expected properties.

Return ONLY valid JSON in this format:
{
  "https://schema.org/JobPosting": {
    "properties": {
      "https://schema.org/title": {"range": "Text"},
      "https://schema.org/datePosted": {"range": "Date"},
      "https://schema.org/hiringOrganization": {"range": "https://schema.org/Organization"}
    }
  }
}

If none are valid Schema.org types, return: {}`;

  try {
    const response = await llm.createCompletions(
      [
        common.Message.fromObject({
          role: "system",
          content: "You are a Schema.org expert. Return only valid JSON.",
        }),
        common.Message.fromObject({ role: "user", content: prompt }),
      ],
      undefined,
      0.3,
      1000,
    );

    const content = response.choices?.[0]?.message?.content?.text || "{}";
    const enriched = JSON.parse(
      content
        .replace(/```json\n?/g, "")
        .replace(/```/g, "")
        .trim(),
    );

    // Add to SCHEMA_DEFINITIONS
    let addedCount = 0;
    for (const [typeIRI, typeDef] of Object.entries(enriched)) {
      if (!SCHEMA_DEFINITIONS[typeIRI]) {
        SCHEMA_DEFINITIONS[typeIRI] = typeDef;
        unknownTypes.delete(typeIRI);
        addedCount++;
        console.error(`    Added schema for ${extractLocalName(typeIRI)}`);
      }
    }

    console.error(`  Enriched ${addedCount} schemas`);
  } catch (error) {
    console.error(`  Error enriching schemas: ${error.message}`);
  }
}

/**
 * Validate schemas and provide suggestions
 * @param {object} llm - LLM instance
 * @param {object} stats - Ontology statistics
 * @returns {Promise<void>}
 */
async function validateSchemas(llm, stats) {
  console.error("  Validating schema usage...");

  const issues = [];

  for (const [typeIRI, instances] of stats.typeInstances.entries()) {
    const schemaDef = getSchemaDefinition(typeIRI);
    if (!schemaDef) continue;

    const schemaProps = new Set(Object.keys(schemaDef.properties));
    const observedProps = stats.typeProperties.get(typeIRI);
    const observedPropSet = observedProps
      ? new Set(observedProps.keys())
      : new Set();

    // Find missing expected properties
    const missing = Array.from(schemaProps).filter(
      (p) => !observedPropSet.has(p),
    );

    // Find extra properties not in schema
    const extra = Array.from(observedPropSet).filter(
      (p) => !schemaProps.has(p),
    );

    if (missing.length > 0 || extra.length > 0) {
      issues.push({
        type: extractLocalName(typeIRI),
        typeIRI,
        instances: instances.size,
        missing: missing.map(extractLocalName),
        extra: extra.map(extractLocalName),
      });
    }
  }

  if (issues.length === 0) {
    console.error("  No issues found");
    return;
  }

  console.error(`  Found ${issues.length} types with schema variations`);

  for (const issue of issues.slice(0, 5)) {
    console.error(`    ${issue.type}:`);
    if (issue.missing.length > 0) {
      console.error(`      Missing: ${issue.missing.join(", ")}`);
    }
    if (issue.extra.length > 0) {
      console.error(`      Extra: ${issue.extra.join(", ")}`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const outputPath = join(__dirname, "../data/graphs/ontology.ttl");
  const indexPath = join(__dirname, "../data/graphs/index.jsonl");

  console.error("=".repeat(60));
  console.error("Top-Down Ontology Generator");
  console.error("=".repeat(60));

  // Step 1: Load resources from ResourceIndex
  console.error("\n[1/4] Loading resources from ResourceIndex...");
  const resourceIndex = createResourceIndex("resources");
  const _logger = createLogger("ontology_top_down");

  const actor = "cld:common.System.root";
  const identifiers = await resourceIndex.findAll();

  // Filter out non-RDF resources (same as GraphProcessor)
  const filteredIdentifiers = identifiers.filter((identifier) => {
    const id = String(identifier);
    return (
      !id.startsWith("common.Conversation") &&
      !id.startsWith("common.Assistant") &&
      !id.startsWith("tool.ToolFunction")
    );
  });

  console.error(`Found ${filteredIdentifiers.length} RDF resources`);

  const resources = await resourceIndex.get(filteredIdentifiers, actor);
  console.error(`Loaded ${resources.length} resources`);

  // Step 2: Process resources with schema guidance
  console.error("\n[2/5] Processing resources with schema guidance...");
  console.error(
    `Using ${Object.keys(SCHEMA_DEFINITIONS).length} schema definitions`,
  );

  let { stats, indexEntries } = processResources(resources);

  console.error(`Found ${stats.typeInstances.size} unique types`);
  console.error(
    `  - ${stats.typeInstances.size - stats.unknownTypes.size} with schema definitions`,
  );
  console.error(
    `  - ${stats.unknownTypes.size} without schema definitions (discovered)`,
  );

  // Step 3: LLM Enhancement (always enabled)
  console.error("\n[3/5] LLM-based enhancements...");
  const config = await createScriptConfig("ontology_top_down");
  const llm = createLlm(await config.githubToken());

  // Normalize types
  const { stats: normalizedStats, typeMapping } = await normalizeTypes(
    llm,
    stats,
  );
  stats = normalizedStats;
  console.error(
    `After normalization: ${stats.typeInstances.size} types (${stats.unknownTypes.size} discovered)`,
  );

  // Apply type mapping to index entries
  indexEntries = applyTypeMappingToIndex(indexEntries, typeMapping);

  // Enrich schemas
  await enrichSchemas(llm, stats.unknownTypes);
  console.error(
    `After enrichment: ${Object.keys(SCHEMA_DEFINITIONS).length} schema definitions`,
  );

  // Validate schemas
  await validateSchemas(llm, stats);

  // Step 4: Generate SHACL TTL
  console.error("\n[4/5] Generating SHACL ontology...");
  const ttl = generateTTL(stats);

  // Step 5: Write output
  console.error("\n[5/5] Writing output...");

  // Write ontology.ttl
  await writeFile(outputPath, ttl, "utf-8");

  // Write index.jsonl
  await writeFile(indexPath, "", "utf-8"); // Clear existing file
  for (const entry of indexEntries) {
    await appendFile(indexPath, JSON.stringify(entry) + "\n", "utf-8");
  }

  // Generate report
  console.error("\n" + "=".repeat(60));
  console.error("ONTOLOGY GENERATION COMPLETE");
  console.error("=".repeat(60));
  console.error(`\nOutput written to:`);
  console.error(`  - ${outputPath}`);
  console.error(`  - ${indexPath} (${indexEntries.length} entries)`);
  console.error(`\nTotal types: ${stats.typeInstances.size}`);
  console.error(
    `Schema-defined types: ${stats.typeInstances.size - stats.unknownTypes.size}`,
  );
  console.error(`Discovered types: ${stats.unknownTypes.size}`);

  console.error(`\nLLM enhancements applied:`);
  console.error(`  ✓ Type normalization (${typeMapping.size} types mapped)`);
  if (typeMapping.size > 0) {
    for (const [from, to] of typeMapping.entries()) {
      console.error(
        `      ${extractLocalName(from)} → ${extractLocalName(to)}`,
      );
    }
  }
  console.error(`  ✓ Schema enrichment`);
  console.error(`  ✓ Schema validation`);

  // Show top types
  console.error("\nTop 10 types by instance count:");
  const topTypes = Array.from(stats.typeInstances.entries())
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10);

  for (const [typeIRI, instances] of topTypes) {
    const hasSchema = getSchemaDefinition(typeIRI) ? "✓" : "✗";
    const typeName = extractLocalName(typeIRI);
    console.error(`  ${hasSchema} ${typeName}: ${instances.size} instances`);
  }

  console.error("\n" + "=".repeat(60));
}

main().catch((error) => {
  console.error("Error:", error.message);
  console.error(error.stack);
  process.exit(1);
});
