/* eslint-env node */
import { UploadInterface } from "./types.js";

/**
 * Upload utility for synchronizing local storage to remote storage
 * Implements object-oriented approach with dependency injection
 */
export class Upload extends UploadInterface {
  #prefixes;
  #local;
  #remote;
  #storageFactory;
  #logger;

  /**
   * Creates a new upload instance with dependency injection
   * @param {Function} storageFactory - Storage factory function
   * @param {object} logger - Logger instance
   * @param {string[]} prefixes - Storage area prefixes to synchronize
   */
  constructor(storageFactory, logger, prefixes = null) {
    super();
    if (!storageFactory) throw new Error("storageFactory is required");
    if (!logger) throw new Error("logger is required");

    this.#storageFactory = storageFactory;
    this.#logger = logger;
    this.#prefixes = prefixes || [
      "config",
      "generated",
      "memories",
      "policies",
      "resources",
      "vectors",
    ];
    this.#local = {};
    this.#remote = {};
  }

  /**
   * Initialize storage instances for all storage areas (prefixes)
   * @returns {Promise<void>}
   */
  async initialize() {
    for (const prefix of this.#prefixes) {
      this.#local[prefix] = this.#storageFactory(prefix, "local");
      this.#remote[prefix] = this.#storageFactory(prefix, "s3");

      // Ensure S3 bucket exists (single bucket with prefixes)
      this.#logger.debug("Ensuring S3 bucket exists", { prefix });
      const created = await this.#remote[prefix].ensureBucket();
      if (created) {
        this.#logger.debug("S3 bucket created", { prefix });
      } else {
        this.#logger.debug("S3 bucket already exists", { prefix });
      }
    }
  }

  /**
   * Upload all items from local storage to S3
   * @returns {Promise<void>}
   */
  async upload() {
    for (const prefix of this.#prefixes) {
      this.#logger.debug("Processing storage area", { prefix });
      await this.#uploadPrefix(prefix);
    }
  }

  /**
   * Upload all items from a storage area, skipping hidden files
   * @param {string} prefix - Storage area prefix
   * @returns {Promise<void>}
   * @private
   */
  async #uploadPrefix(prefix) {
    const local = this.#local[prefix];
    const remote = this.#remote[prefix];

    try {
      const keys = await local.list();

      // Filter out hidden files (starting with ".")
      const filteredKeys = keys.filter((key) => !key.startsWith("."));

      this.#logger.debug("Items found for upload", {
        prefix,
        total: keys.length,
        uploaded: filteredKeys.length,
        filtered: keys.length - filteredKeys.length,
      });

      for (const key of filteredKeys) {
        try {
          const data = await local.get(key);
          await remote.put(key, data);
          this.#logger.debug("Item uploaded", { prefix, key });
        } catch (error) {
          this.#logger.debug("Item error", { prefix, key, error: error.message });
          throw error;
        }
      }
    } catch (error) {
      this.#logger.debug("Processing error", { prefix, error: error.message });
      throw error;
    }
  }
}