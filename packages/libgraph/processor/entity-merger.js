/* eslint-env node */

import { toShortName } from "../schema.js";
import { detectSynonyms } from "./llm-normalizer.js";

/**
 * EntityMerger handles synonym detection and entity consolidation
 */
export class EntityMerger {
  #llm;
  #logger;
  #synonymResults = [];
  #entityMergeMap = new Map();

  /**
   * Creates a new EntityMerger instance
   * @param {object} llm - LLM instance for synonym detection
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance
   */
  constructor(llm, logger) {
    if (!llm) throw new Error("llm is required");
    if (!logger) throw new Error("logger is required");
    this.#llm = llm;
    this.#logger = logger;
  }

  /**
   * Build reverse map from entity name to IRIs
   * @param {Map<string, string>} entityNames - IRI to name map
   * @returns {Map<string, string[]>} Name to IRIs map
   * @private
   */
  #buildNameToIRIMap(entityNames) {
    const nameToIRI = new Map();
    for (const [iri, name] of entityNames.entries()) {
      if (!nameToIRI.has(name)) {
        nameToIRI.set(name, []);
      }
      nameToIRI.get(name).push(iri);
    }
    return nameToIRI;
  }

  /**
   * Build entity merge map from synonym merges
   * @param {Array} merges - Synonym merge results
   * @param {Map<string, string[]>} nameToIRI - Name to IRIs map
   * @private
   */
  #buildEntityMergeMap(merges, nameToIRI) {
    for (const merge of merges) {
      const canonicalIRIs = nameToIRI.get(merge.canonical) || [];
      if (canonicalIRIs.length === 0) continue;

      const canonicalIRI = canonicalIRIs[0];

      for (const alias of merge.aliases) {
        const aliasIRIs = nameToIRI.get(alias) || [];
        for (const aliasIRI of aliasIRIs) {
          if (aliasIRI !== canonicalIRI) {
            this.#entityMergeMap.set(aliasIRI, canonicalIRI);
            this.#logger.debug(
              "EntityMerger",
              `Entity merge: ${alias} → ${merge.canonical}`,
            );
          }
        }
      }
    }
  }

  /**
   * Detect synonyms among entities for each type and build entity merge map
   * @param {Map<string, Set<string>>} typeExamples - Type to entity names map
   * @param {Map<string, string>} entityNames - IRI to name map
   * @returns {Promise<void>}
   */
  async detectAndBuildMergeMap(typeExamples, entityNames) {
    this.#synonymResults = [];
    this.#entityMergeMap = new Map();

    const nameToIRI = this.#buildNameToIRIMap(entityNames);

    for (const [typeIRI, examples] of typeExamples.entries()) {
      const exampleNames = Array.from(examples);
      if (exampleNames.length < 2) continue;

      const typeName = toShortName(typeIRI);
      const merges = await detectSynonyms(
        this.#llm,
        typeName,
        exampleNames,
        (level, msg) => this.#logger[level]?.("EntityMerger", msg),
      );

      if (merges.length > 0) {
        this.#synonymResults.push({ typeIRI, merges });
        this.#buildEntityMergeMap(merges, nameToIRI);
      }
    }

    this.#logger.debug("EntityMerger", "Synonym detection complete", {
      typesWithSynonyms: this.#synonymResults.length,
      entitiesToMerge: this.#entityMergeMap.size,
    });
  }

  /**
   * Get the synonym detection results
   * @returns {Array} Synonym results
   */
  getSynonymResults() {
    return this.#synonymResults;
  }

  /**
   * Get the entity merge map
   * @returns {Map<string, string>} Entity merge map (alias IRI -> canonical IRI)
   */
  getMergeMap() {
    return this.#entityMergeMap;
  }
}
