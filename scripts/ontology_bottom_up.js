#!/usr/bin/env node
/* eslint-disable max-lines */

/**
 * Bottom-Up Ontology Generator
 *
 * Analyzes RDF graph data to discover entity types, synonyms, and generates
 * both JSON and SHACL TTL ontology outputs using:
 * - Signature-based synonym detection (identical property patterns)
 * - Semantic similarity matching (LLM embeddings + cosine similarity)
 * - LLM validation for semantic accuracy
 * - Semantic suffix filtering to prevent false positives
 *
 * USAGE:
 *
 * Basic usage (uses default data/graphs/index.jsonl):
 * npx env-cmd -- node scripts/ontology_bottom_up.js
 *
 * With custom input file (positional argument):
 * npx env-cmd -- node scripts/ontology_bottom_up.js data/graphs/index.jsonl
 *
 * With custom input file (--input flag):
 * npx env-cmd -- node scripts/ontology_bottom_up.js --input data/graphs/index.jsonl
 * npx env-cmd -- node scripts/ontology_bottom_up.js -i data/graphs/index.jsonl
 *
 * With custom similarity threshold (default: 0.7, range: 0.0-1.0):
 * npx env-cmd -- node scripts/ontology_bottom_up.js -t 0.75
 * npx env-cmd -- node scripts/ontology_bottom_up.js --threshold 0.75
 *
 * With custom minimum frequency (default: 2):
 * npx env-cmd -- node scripts/ontology_bottom_up.js -m 3
 * npx env-cmd -- node scripts/ontology_bottom_up.js --minFrequency 3
 *
 * Combined options:
 * npx env-cmd -- node scripts/ontology_bottom_up.js data/graphs/index.jsonl -t 0.75 -m 3
 *
 * OUTPUT:
 * - TTL: data/graphs/ontology.ttl
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createLlmApi } from "@copilot-ld/libllm";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { common } from "@copilot-ld/libtype";
import { parseArgs } from "node:util";
import { DataFactory, Writer } from "n3";

const { namedNode, literal } = DataFactory;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = await createScriptConfig("ontology_bottom_up");

/**
 * Check if a term is a common.Message identifier (should be skipped)
 * @param {string} term - Term to check
 * @returns {boolean} True if term is a common.Message identifier
 */
function isCommonMessageIdentifier(term) {
  return term.startsWith("common.Message.");
}

/**
 * Extracts local name from IRI (e.g., "Organization" from "https://schema.org/Organization")
 * @param {string} iri - Full IRI
 * @returns {string} Local name or IRI if no separator found
 */
function extractLocalName(iri) {
  const parts = iri.split(/[#/]/);
  return parts[parts.length - 1] || iri;
}

/**
 * Clean name for use in URIs and keys (currently unused but may be needed)
 * @param {string} name - Name to clean
 * @returns {string} Cleaned name
 */
// eslint-disable-next-line no-unused-vars
function cleanName(name) {
  return name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Normalizes a vector to unit length
 * @param {number[]} vector - Vector to normalize
 * @returns {number[]} Normalized vector
 */
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector.slice();
  return vector.map((val) => val / magnitude);
}

/**
 * Calculates cosine similarity (dot product for normalized vectors)
 * @param {number[]} a - First normalized vector
 * @param {number[]} b - Second normalized vector
 * @returns {number} Cosine similarity score
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
}

/**
 * Find synonyms using semantic similarity (embeddings + cosine similarity)
 * @param {Map<string, object>} termCounts - Map of term to metadata
 * @param {Map<string, number[]>} termEmbeddings - Map of term to embedding vector
 * @param {number} threshold - Similarity threshold
 * @returns {Map<string, Set<string>>} Map of canonical term to synonyms
 */
// eslint-disable-next-line complexity
function findSynonymsBySemanticSimilarity(
  termCounts,
  termEmbeddings,
  threshold,
) {
  const synonymCandidates = new Map();
  const processed = new Set();

  // Get all terms, filtered
  const terms = Array.from(termCounts.keys()).filter(
    (term) => !isCommonMessageIdentifier(term),
  );

  // Sort by frequency (descending) to prioritize most frequent as canonical
  const sortedTerms = terms.sort(
    (a, b) => (termCounts.get(b)?.count || 0) - (termCounts.get(a)?.count || 0),
  );

  for (const term of sortedTerms) {
    // Skip if already processed as a synonym
    if (processed.has(term)) continue;

    const embedding = termEmbeddings.get(term);
    if (!embedding) {
      // Term without embedding - keep as standalone
      processed.add(term);
      continue;
    }

    // Create canonical term entry
    const synonyms = new Set([term]);

    // Find similar terms
    for (const otherTerm of terms) {
      if (processed.has(otherTerm) || term === otherTerm) continue;

      const otherEmbedding = termEmbeddings.get(otherTerm);
      if (!otherEmbedding) continue;

      // Check for semantic incompatibility
      const label1 = (
        termCounts.get(term)?.label || extractLocalName(term)
      ).toLowerCase();
      const label2 = (
        termCounts.get(otherTerm)?.label || extractLocalName(otherTerm)
      ).toLowerCase();
      if (hasIncompatibleSemantics(label1, label2)) {
        continue;
      }

      const similarity = cosineSimilarity(embedding, otherEmbedding);

      if (similarity >= threshold) {
        synonyms.add(otherTerm);
        processed.add(otherTerm);
      }
    }

    // Mark this term as processed
    processed.add(term);

    // Only add if we found actual synonyms (more than just the term itself)
    if (synonyms.size > 1) {
      synonymCandidates.set(term, synonyms);
    }
  }

  return synonymCandidates;
}

/**
 * Build entity signatures for synonym detection
 * Entities with identical property patterns are likely synonyms
 * @param {Map<string, Array>} entityInstances - Map of type to instances
 * @returns {Map<string, Array>} Map of signature to entities
 */
function buildEntitySignatures(entityInstances) {
  const signatures = new Map();

  for (const [typeIRI, instances] of entityInstances.entries()) {
    for (const instance of instances) {
      const properties = [];

      // Sort properties to create consistent signature
      for (const [predicate, objects] of Object.entries(
        instance.properties || {},
      )) {
        for (const obj of objects) {
          const objValue = typeof obj === "object" ? obj.value : obj;
          properties.push(`${extractLocalName(predicate)}:${objValue}`);
        }
      }

      // Create signature - store but don't use directly (used for grouping)
      const _signature = properties.sort().join("|");

      if (!signatures.has(_signature)) {
        signatures.set(_signature, []);
      }

      signatures.get(_signature).push({
        label: instance.label,
        type: typeIRI,
        instance: instance.id,
      });
    }
  }

  return signatures;
}

/**
 * Find synonyms based on identical entity signatures
 * @param {Map<string, Array>} signatures - Entity signatures
 * @param {number} minFrequency - Minimum frequency threshold
 * @returns {Map<string, Set<string>>} Map of type to synonym labels
 */
function findSynonymsBySignature(signatures, minFrequency) {
  const synonymCandidates = new Map();

  for (const [_signature, entities] of signatures.entries()) {
    if (entities.length < minFrequency) continue;

    // Group by type
    const byType = new Map();
    for (const entity of entities) {
      // Skip common.Message identifiers
      if (isCommonMessageIdentifier(entity.label)) continue;

      if (!byType.has(entity.type)) {
        byType.set(entity.type, new Set());
      }
      byType.get(entity.type).add(entity.label);
    }

    // Multiple labels for same type with same signature = likely synonyms
    for (const [type, labels] of byType.entries()) {
      if (labels.size > 1) {
        if (!synonymCandidates.has(type)) {
          synonymCandidates.set(type, new Set());
        }
        labels.forEach((label) => synonymCandidates.get(type).add(label));
      }
    }
  }

  return synonymCandidates;
}

/**
 * Check if two terms have incompatible semantic suffixes
 * Terms with different semantic suffixes should not be grouped as synonyms
 * @param {string} label1 - First label
 * @param {string} label2 - Second label
 * @returns {boolean} True if terms have incompatible suffixes
 */
function hasIncompatibleSemantics(label1, label2) {
  // Define semantic categories that should not be mixed
  const semanticSuffixes = [
    "organization",
    "trial",
    "event",
    "person",
    "place",
    "document",
    "posting",
    "article",
    "drug",
    "policy",
    "project",
    "service",
    "application",
    "work",
    "page",
    "question",
    "answer",
    "comment",
    "review",
    "rating",
    "course",
    "role",
  ];

  const lower1 = label1.toLowerCase();
  const lower2 = label2.toLowerCase();

  // Extract suffixes from both labels
  let suffix1 = null;
  let suffix2 = null;

  for (const suffix of semanticSuffixes) {
    if (lower1.endsWith(suffix)) {
      suffix1 = suffix;
    }
    if (lower2.endsWith(suffix)) {
      suffix2 = suffix;
    }
  }

  // If both have suffixes and they're different, they're incompatible
  if (suffix1 && suffix2 && suffix1 !== suffix2) {
    return true;
  }

  return false;
}

/**
 * Use LLM to validate and refine synonym groups
 * @param {object} llm - LLM instance
 * @param {string} typeLabel - Type label
 * @param {Set<string>} terms - Candidate synonym terms
 * @param {Array<string>} sampleContexts - Sample usage contexts
 * @returns {Promise<Array<object>|null>} Validated synonym groups or null
 */
async function validateSynonymsWithLLM(llm, typeLabel, terms, sampleContexts) {
  const prompt = `Given these terms that appear as "${typeLabel}" entities in a knowledge graph:

Terms: ${Array.from(terms).join(", ")}

Sample contexts where they appear:
${sampleContexts.slice(0, 10).join("\n")}

Task: CAREFULLY group these terms by meaning. Terms are ONLY synonyms if they represent the EXACT SAME CONCEPT with different words.

IMPORTANT RULES:
- Different entity types (e.g., Organization vs Trial, Document vs Posting) are NOT synonyms
- Terms with different semantic suffixes (Organization, Trial, Event, etc.) should be in SEPARATE groups
- Only group terms if they are truly interchangeable in meaning
- When in doubt, keep terms in separate groups

Return ONLY valid JSON in this exact format:
{
  "groups": [
    {"preferred": "MostCommonTerm", "synonyms": ["Synonym1", "Synonym2"]},
    {"preferred": "AnotherTerm", "synonyms": []}
  ]
}

If terms should NOT be grouped together, return them as separate groups with empty synonyms arrays.`;

  try {
    const response = await llm.createCompletions(
      [
        common.Message.fromObject({
          role: "system",
          content: "You are a knowledge graph expert. Return only valid JSON.",
        }),
        common.Message.fromObject({
          role: "user",
          content: prompt,
        }),
      ],
      undefined, // no tools
      0.3, // temperature
      1000, // max_tokens
    );

    const content = response.choices?.[0]?.message?.content?.text || "{}";
    const result = JSON.parse(content);
    return result.groups || [];
  } catch (error) {
    console.error(`LLM validation error for ${typeLabel}:`, error.message);
    return null;
  }
}

/**
 * Merge synonym sets from multiple detection methods
 * @param {Map<string, Set<string>>} signatureSynonyms - Signature-based synonyms
 * @param {Map<string, Set<string>>} similaritySynonyms - Similarity-based synonyms
 * @returns {Map<string, Set<string>>} Merged synonym map
 */
function mergeSynonymSets(signatureSynonyms, similaritySynonyms) {
  const merged = new Map();

  // Start with signature-based (more reliable)
  for (const [canonical, synonyms] of signatureSynonyms.entries()) {
    merged.set(canonical, new Set(synonyms));
  }

  // Add similarity-based synonyms
  for (const [canonical, synonyms] of similaritySynonyms.entries()) {
    if (!merged.has(canonical)) {
      merged.set(canonical, new Set());
    }
    synonyms.forEach((syn) => merged.get(canonical).add(syn));
  }

  return merged;
}

/**
 * Generate SHACL Turtle (TTL) format from ontology data
 * @param {object} output - The ontology output object
 * @param {Map<string, object>} classCounts - Map of class IRIs to metadata
 * @param {Map<string, object>} predicateCounts - Map of predicate IRIs to metadata
 * @param {Map<string, Array>} entityInstances - Map of class to instances
 * @returns {string} TTL formatted string
 */
function generateTTL(output, classCounts, predicateCounts, entityInstances) {
  const prefixes = {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    sh: "http://www.w3.org/ns/shacl#",
    dct: "http://purl.org/dc/terms/",
    schema: "https://schema.org/",
    foaf: "http://xmlns.com/foaf/0.1/",
    skos: "http://www.w3.org/2004/02/skos/core#",
  };

  const writer = new Writer({ prefixes });

  // Sort canonical terms by count (descending)
  const sortedTerms = Object.entries(output.canonical_terms).sort(
    (a, b) => b[1].count - a[1].count,
  );

  for (const [classIRI, classData] of sortedTerms) {
    const shapeIRI = `${classIRI}Shape`;
    const className = classData.label;

    // Add shape metadata
    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
      namedNode("http://www.w3.org/ns/shacl#NodeShape"),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/ns/shacl#targetClass"),
      namedNode(classIRI),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://purl.org/dc/terms/source"),
      namedNode(classIRI),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://purl.org/dc/terms/description"),
      literal(`Shape for ${className} instances`),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/ns/shacl#name"),
      literal(className),
    );

    writer.addQuad(
      namedNode(shapeIRI),
      namedNode("http://www.w3.org/ns/shacl#comment"),
      literal(`Instances: ${classData.count}`),
    );

    // Add synonym information using SKOS if available
    if (classData.synonyms && classData.synonyms.length > 0) {
      for (const synonym of classData.synonyms) {
        const synonymLabel = extractLocalName(synonym);
        writer.addQuad(
          namedNode(shapeIRI),
          namedNode("http://www.w3.org/2004/02/skos/core#altLabel"),
          literal(synonymLabel),
        );
      }
    }

    // Find properties for this class
    const instances = entityInstances.get(classIRI) || [];
    const propertyUsage = new Map(); // predicate -> count

    for (const instance of instances) {
      for (const predicate of Object.keys(instance.properties || {})) {
        propertyUsage.set(predicate, (propertyUsage.get(predicate) || 0) + 1);
      }
    }

    // Sort properties by usage frequency
    const sortedProperties = Array.from(propertyUsage.entries()).sort(
      (a, b) => b[1] - a[1],
    );

    // Add property shapes
    for (const [predicateIRI, usageCount] of sortedProperties) {
      const predicateData = output.relationships[predicateIRI];
      const predicateName =
        predicateData?.label || extractLocalName(predicateIRI);

      const propertyPredicates = [
        {
          predicate: namedNode(
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          ),
          object: namedNode("http://www.w3.org/ns/shacl#PropertyShape"),
        },
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#path"),
          object: namedNode(predicateIRI),
        },
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#name"),
          object: literal(predicateName),
        },
        {
          predicate: namedNode("http://www.w3.org/ns/shacl#comment"),
          object: literal(`Instances: ${usageCount}`),
        },
      ];

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
 * Main function
 */
// eslint-disable-next-line complexity
async function main() {
  const { values, positionals } = parseArgs({
    options: {
      threshold: {
        type: "string",
        short: "t",
        default: "0.7",
      },
      minFrequency: {
        type: "string",
        short: "m",
        default: "2",
      },
      input: {
        type: "string",
        short: "i",
      },
    },
    allowPositionals: true,
  });

  const similarityThreshold = parseFloat(values.threshold);
  const minFrequency = parseInt(values.minFrequency);

  if (
    isNaN(similarityThreshold) ||
    similarityThreshold < 0 ||
    similarityThreshold > 1
  ) {
    console.error("Error: threshold must be a number between 0.0 and 1.0");
    process.exit(1);
  }

  if (isNaN(minFrequency) || minFrequency < 1) {
    console.error("Error: minFrequency must be a positive integer");
    process.exit(1);
  }

  // Determine input path
  const inputPath =
    positionals[0] ||
    values.input ||
    join(__dirname, "../data/graphs/index.jsonl");

  // Output path for TTL ontology
  const graphsDir = join(__dirname, "../data/graphs");
  const outputTTLPath = join(graphsDir, "ontology.ttl");

  console.log("=".repeat(60));
  console.log("RDF Bottom-Up Ontology Generator");
  console.log("=".repeat(60));

  // Step 1: Read and parse index.jsonl
  console.log("\n[1/7] Loading graph data...");
  const content = await readFile(inputPath, "utf-8");
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim());
  console.log(`Read ${lines.length} entries from ${inputPath}`);

  const classCounts = new Map(); // IRI -> {count, label, instances}
  const predicateCounts = new Map(); // IRI -> {count, label}
  const entityInstances = new Map(); // typeIRI -> [instances]
  const rdfTypeIRI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

  // Step 2: Analyze entity types and properties
  console.log("\n[2/7] Analyzing entity types and properties...");
  let totalQuads = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (!entry.quads || !Array.isArray(entry.quads)) continue;

      totalQuads += entry.quads.length;

      // Build entity instance data
      const instanceData = {
        id: entry.id,
        label: extractLocalName(entry.id || "unknown"),
        properties: {},
        types: [],
      };

      for (const quad of entry.quads) {
        if (!quad.predicate?.value) continue;

        const predicateIRI = quad.predicate.value;
        const subjectIRI = quad.subject?.value || entry.id;

        // Extract classes from rdf:type
        if (predicateIRI === rdfTypeIRI && quad.object?.value) {
          const classIRI = quad.object.value;

          // Skip common.Message identifiers
          if (isCommonMessageIdentifier(classIRI)) continue;

          instanceData.types.push(classIRI);

          if (!classCounts.has(classIRI)) {
            classCounts.set(classIRI, {
              count: 0,
              label: extractLocalName(classIRI),
              instances: [],
            });
          }
          classCounts.get(classIRI).count++;
          classCounts.get(classIRI).instances.push(subjectIRI);
        }

        // Extract predicates
        if (predicateIRI !== rdfTypeIRI) {
          if (!predicateCounts.has(predicateIRI)) {
            predicateCounts.set(predicateIRI, {
              count: 0,
              label: extractLocalName(predicateIRI),
            });
          }
          predicateCounts.get(predicateIRI).count++;

          // Track properties for signature analysis
          if (!instanceData.properties[predicateIRI]) {
            instanceData.properties[predicateIRI] = [];
          }
          instanceData.properties[predicateIRI].push(quad.object);
        }
      }

      // Store instance data by type
      for (const typeIRI of instanceData.types) {
        if (!entityInstances.has(typeIRI)) {
          entityInstances.set(typeIRI, []);
        }
        entityInstances.get(typeIRI).push(instanceData);
      }
    } catch (error) {
      console.error(`Error parsing line: ${error.message}`);
    }
  }

  console.log(`Processed ${totalQuads} quads`);
  console.log(`Found ${classCounts.size} unique classes`);
  console.log(`Found ${predicateCounts.size} unique predicates`);
  console.log(`Tracked ${entityInstances.size} entity type groups`);

  // Step 3: Find synonyms by entity signature
  console.log("\n[3/7] Finding synonyms by entity signatures...");
  const signatures = buildEntitySignatures(entityInstances);
  const signatureSynonyms = findSynonymsBySignature(signatures, minFrequency);
  console.log(
    `Found ${signatureSynonyms.size} types with signature-based synonym candidates`,
  );

  // Step 4: Compute embeddings and find synonyms by semantic similarity
  console.log("\n[4/7] Computing embeddings for semantic similarity...");
  const llm = createLlmApi(
    await config.llmToken(),
    undefined,
    config.llmBaseUrl(),
  );

  // Prepare texts for embedding (use local names for better semantic meaning)
  const classTexts = Array.from(classCounts.keys())
    .filter((iri) => !isCommonMessageIdentifier(iri))
    .map((iri) => extractLocalName(iri));
  const predicateTexts = Array.from(predicateCounts.keys())
    .filter((iri) => !isCommonMessageIdentifier(iri))
    .map((iri) => extractLocalName(iri));

  console.log(`  Computing embeddings for ${classTexts.length} classes...`);
  const classEmbeddingsArray = await llm.createEmbeddings(classTexts);
  const classEmbeddingMap = new Map();
  const classIRIs = Array.from(classCounts.keys()).filter(
    (iri) => !isCommonMessageIdentifier(iri),
  );
  for (let i = 0; i < classIRIs.length; i++) {
    const iri = classIRIs[i];
    if (i < classEmbeddingsArray.length && classEmbeddingsArray[i]?.embedding) {
      const normalized = normalizeVector(classEmbeddingsArray[i].embedding);
      classEmbeddingMap.set(iri, normalized);
    }
  }

  console.log(
    `  Computing embeddings for ${predicateTexts.length} predicates...`,
  );
  const predicateEmbeddingsArray = await llm.createEmbeddings(predicateTexts);
  const predicateEmbeddingMap = new Map();
  const predicateIRIs = Array.from(predicateCounts.keys()).filter(
    (iri) => !isCommonMessageIdentifier(iri),
  );
  for (let i = 0; i < predicateIRIs.length; i++) {
    const iri = predicateIRIs[i];
    if (
      i < predicateEmbeddingsArray.length &&
      predicateEmbeddingsArray[i]?.embedding
    ) {
      const normalized = normalizeVector(predicateEmbeddingsArray[i].embedding);
      predicateEmbeddingMap.set(iri, normalized);
    }
  }

  console.log("  Finding synonyms by semantic similarity...");
  const classSimilaritySynonyms = findSynonymsBySemanticSimilarity(
    classCounts,
    classEmbeddingMap,
    similarityThreshold,
  );
  const predicateSimilaritySynonyms = findSynonymsBySemanticSimilarity(
    predicateCounts,
    predicateEmbeddingMap,
    similarityThreshold,
  );
  console.log(
    `  Found ${classSimilaritySynonyms.size} class synonym groups by semantic similarity`,
  );
  console.log(
    `  Found ${predicateSimilaritySynonyms.size} predicate synonym groups by semantic similarity`,
  );

  // Step 5: Merge synonym sets
  console.log("\n[5/7] Merging synonym candidates...");
  const mergedClassSynonyms = mergeSynonymSets(
    signatureSynonyms,
    classSimilaritySynonyms,
  );
  const mergedPredicateSynonyms = predicateSimilaritySynonyms;

  // Step 6: LLM validation and refinement
  console.log("\n[6/7] Validating and refining synonyms with LLM...");

  // Track LLM-refined synonym groups
  const llmRefinedClasses = new Map();

  // Validate class synonyms (prioritize most frequent types)
  const classGroups = Array.from(mergedClassSynonyms.entries())
    .filter(([_canonical, synonyms]) => synonyms.size >= 2)
    .sort(
      (a, b) =>
        (classCounts.get(b[0])?.count || 0) -
        (classCounts.get(a[0])?.count || 0),
    );

  console.log(`  Processing ${classGroups.length} class synonym groups...`);

  for (let i = 0; i < classGroups.length; i++) {
    const [canonical, synonyms] = classGroups[i];
    const typeLabel =
      classCounts.get(canonical)?.label || extractLocalName(canonical);
    const count = classCounts.get(canonical)?.count || 0;

    // Build context from entity instances
    const contexts = [
      `Entity type: ${typeLabel} appears ${count} times`,
      `Candidate synonyms: ${Array.from(synonyms).join(", ")}`,
    ];

    // Add sample property patterns if available
    const instances = entityInstances.get(canonical) || [];
    if (instances.length > 0) {
      const sampleProps = Object.keys(instances[0].properties || {})
        .map((p) => extractLocalName(p))
        .slice(0, 5);
      if (sampleProps.length > 0) {
        contexts.push(`Common properties: ${sampleProps.join(", ")}`);
      }
    }

    const validated = await validateSynonymsWithLLM(
      llm,
      typeLabel,
      synonyms,
      contexts,
    );

    if (validated && validated.length > 0) {
      console.log(
        `  [${i + 1}/${classGroups.length}] ${typeLabel}: ${validated.length} refined groups`,
      );

      // Store LLM-refined groups
      for (const group of validated) {
        const groupCanonical = group.preferred;
        llmRefinedClasses.set(groupCanonical, {
          synonyms: group.synonyms.filter((s) => s !== groupCanonical),
          original_canonical: canonical,
        });
      }
    } else {
      console.log(
        `  [${i + 1}/${classGroups.length}] ${typeLabel}: keeping original grouping`,
      );
    }

    // Rate limiting to avoid API throttling
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(
    `  LLM validation complete: refined ${llmRefinedClasses.size} groups`,
  );

  // Step 7: Build output ontology
  console.log("\n[7/7] Building ontology output...");

  const output = {
    canonical_terms: {},
    relationships: {},
    metadata: {
      total_classes: classCounts.size,
      total_predicates: predicateCounts.size,
      synonym_groups_classes: mergedClassSynonyms.size,
      synonym_groups_predicates: mergedPredicateSynonyms.size,
      llm_refined_groups: llmRefinedClasses.size,
      similarity_threshold: similarityThreshold,
      min_frequency: minFrequency,
    },
  };

  // Add canonical terms (classes) with their synonyms
  // Prioritize LLM-refined groups, fall back to merged groups
  const processedClasses = new Set();

  // First, add LLM-refined groups
  for (const [canonical, data] of llmRefinedClasses.entries()) {
    const originalCanonical = data.original_canonical;
    const classInfo =
      classCounts.get(originalCanonical) || classCounts.get(canonical);

    output.canonical_terms[canonical] = {
      label: classInfo?.label || extractLocalName(canonical),
      synonyms: data.synonyms,
      count: classInfo?.count || 0,
      llm_refined: true,
    };

    processedClasses.add(originalCanonical);
    processedClasses.add(canonical);
    // Mark all synonyms as processed
    data.synonyms.forEach((s) => processedClasses.add(s));
  }

  // Then add remaining merged groups that weren't refined by LLM
  for (const [canonical, synonyms] of mergedClassSynonyms.entries()) {
    if (processedClasses.has(canonical)) continue;

    const classInfo = classCounts.get(canonical);
    const synonymList = Array.from(synonyms).filter(
      (s) => s !== canonical && !processedClasses.has(s),
    );

    if (classInfo) {
      output.canonical_terms[canonical] = {
        label: classInfo.label || extractLocalName(canonical),
        synonyms: synonymList,
        count: classInfo.count || 0,
        llm_refined: false,
      };

      processedClasses.add(canonical);
      synonymList.forEach((s) => processedClasses.add(s));
    }
  }

  // Add classes without synonyms
  for (const [classIRI, info] of classCounts.entries()) {
    if (!processedClasses.has(classIRI) && info.count >= minFrequency) {
      output.canonical_terms[classIRI] = {
        label: info.label,
        synonyms: [],
        count: info.count,
        llm_refined: false,
      };
    }
  }

  // Add relationships (predicates) with their synonyms
  for (const [_canonical, synonyms] of mergedPredicateSynonyms.entries()) {
    const predInfo = predicateCounts.get(_canonical);
    const synonymList = Array.from(synonyms).filter((s) => s !== _canonical);

    output.relationships[_canonical] = {
      label: predInfo?.label || extractLocalName(_canonical),
      synonyms: synonymList,
      count: predInfo?.count || 0,
    };
  }

  // Add predicates without synonyms
  for (const [predIRI, info] of predicateCounts.entries()) {
    if (!output.relationships[predIRI] && info.count >= minFrequency) {
      output.relationships[predIRI] = {
        label: info.label,
        synonyms: [],
        count: info.count,
      };
    }
  }

  // Generate and write TTL output
  console.log("\nGenerating TTL ontology...");
  const ttlContent = generateTTL(
    output,
    classCounts,
    predicateCounts,
    entityInstances,
  );
  await writeFile(outputTTLPath, ttlContent, "utf-8");

  // Generate report
  console.log("\n" + "=".repeat(60));
  console.log("ONTOLOGY GENERATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`\nTTL output written to: ${outputTTLPath}`);
  console.log(
    `\nCanonical terms: ${Object.keys(output.canonical_terms).length}`,
  );
  console.log(`Relationships: ${Object.keys(output.relationships).length}`);

  const totalClassSynonyms = Object.values(output.canonical_terms).reduce(
    (sum, term) => sum + term.synonyms.length,
    0,
  );
  const totalPredSynonyms = Object.values(output.relationships).reduce(
    (sum, rel) => sum + rel.synonyms.length,
    0,
  );

  console.log(`Total class synonyms: ${totalClassSynonyms}`);
  console.log(`Total relationship synonyms: ${totalPredSynonyms}`);

  console.log("\nTop 10 canonical terms by frequency:");
  const topTerms = Object.entries(output.canonical_terms)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  for (const [_iri, data] of topTerms) {
    console.log(
      `  ${data.label}: ${data.count} instances, ${data.synonyms.length} synonyms`,
    );
  }

  console.log("\n" + "=".repeat(60));
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
