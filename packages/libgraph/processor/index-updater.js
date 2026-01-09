/* eslint-env node */

const RDF_TYPE_IRI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

/**
 * IndexUpdater handles updating graph index with type mappings and entity merging
 */
export class IndexUpdater {
  #storage;
  #logger;

  /**
   * Creates a new IndexUpdater instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage instance
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance
   */
  constructor(storage, logger) {
    if (!storage) throw new Error("storage is required");
    if (!logger) throw new Error("logger is required");
    this.#storage = storage;
    this.#logger = logger;
  }

  /**
   * Apply type mapping to quads in the graph index
   * Updates rdf:type assertions with normalized canonical types
   * @param {Map<string, string>} typeMapping - Map of discovered type -> canonical type
   * @returns {Promise<void>}
   */
  async applyTypeMapping(typeMapping) {
    if (typeMapping.size === 0) return;

    this.#logger.debug("IndexUpdater", "Applying type mapping to index", {
      mappings: typeMapping.size,
    });

    try {
      const entries = await this.#storage.get("index.jsonl");
      if (!entries || !Array.isArray(entries)) return;

      for (const entry of entries) {
        if (entry.quads && Array.isArray(entry.quads)) {
          entry.quads = entry.quads.map((quad) => {
            if (
              quad.predicate?.value === RDF_TYPE_IRI &&
              quad.object?.termType === "NamedNode"
            ) {
              const canonicalType = typeMapping.get(quad.object.value);
              if (canonicalType) {
                return {
                  ...quad,
                  object: { ...quad.object, value: canonicalType },
                };
              }
            }
            return quad;
          });
        }
      }

      const jsonlContent =
        entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await this.#storage.put("index.jsonl", jsonlContent);

      this.#logger.debug("IndexUpdater", "Type mapping applied to index", {
        entries: entries.length,
      });
    } catch (error) {
      this.#logger.error(
        "IndexUpdater",
        "Failed to apply type mapping to index",
        { error: error.message },
      );
    }
  }

  /**
   * Apply entity merging to the graph index
   * Updates all references to alias entities to point to canonical entities
   * @param {Map<string, string>} entityMergeMap - Alias IRI to canonical IRI map
   * @returns {Promise<void>}
   */
  async applyEntityMerging(entityMergeMap) {
    if (entityMergeMap.size === 0) return;

    this.#logger.debug("IndexUpdater", "Applying entity merging to index", {
      merges: entityMergeMap.size,
    });

    try {
      const entries = await this.#storage.get("index.jsonl");
      if (!entries || !Array.isArray(entries)) return;

      let mergedCount = 0;

      for (const entry of entries) {
        if (entry.quads && Array.isArray(entry.quads)) {
          entry.quads = entry.quads.map((quad) => {
            let modified = false;

            if (quad.subject?.value && entityMergeMap.has(quad.subject.value)) {
              quad = {
                ...quad,
                subject: {
                  ...quad.subject,
                  value: entityMergeMap.get(quad.subject.value),
                },
              };
              modified = true;
            }

            if (
              quad.object?.termType === "NamedNode" &&
              entityMergeMap.has(quad.object.value)
            ) {
              quad = {
                ...quad,
                object: {
                  ...quad.object,
                  value: entityMergeMap.get(quad.object.value),
                },
              };
              modified = true;
            }

            if (modified) mergedCount++;
            return quad;
          });
        }
      }

      const jsonlContent =
        entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await this.#storage.put("index.jsonl", jsonlContent);

      this.#logger.debug("IndexUpdater", "Entity merging applied", {
        entries: entries.length,
        triplesUpdated: mergedCount,
      });
    } catch (error) {
      this.#logger.error("IndexUpdater", "Failed to apply entity merging", {
        error: error.message,
      });
    }
  }
}
