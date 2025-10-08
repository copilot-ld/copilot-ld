/* eslint-env node */
import path from "path";

/**
 * Uploader utility for synchronizing local storage to remote storage
 * Implements object-oriented approach with dependency injection
 */
export class Uploader {
  #prefixes;
  #local;
  #remote;
  #storageFactory;
  #logger;

  /**
   * Creates a new upload instance with dependency injection
   * @param {Function} storageFn - Storage factory function
   * @param {object} logger - Logger instance
   * @param {string[]} prefixes - Storage area prefixes to synchronize
   */
  constructor(storageFn, logger, prefixes = null) {
    if (!storageFn) throw new Error("storageFn is required");
    if (!logger) throw new Error("logger is required");

    this.#storageFactory = storageFn;
    this.#logger = logger;
    this.#prefixes = prefixes || [
      "config",
      "generated",
      "memories",
      "policies",
      "resources",
      "triples",
      "vectors",
    ];
    this.#local = {};
    this.#remote = {};
  }

  /**
   * Initialize storage instances for all storage areas (prefixes)
   * @param {boolean} localOnly - If true, only initialize local storage
   * @returns {Promise<void>}
   */
  async initialize(localOnly = false) {
    for (const prefix of this.#prefixes) {
      this.#local[prefix] = this.#storageFactory(prefix, "local");

      if (!localOnly) {
        this.#remote[prefix] = this.#storageFactory(prefix, "s3");
        // Ensure S3 bucket exists (single bucket with prefixes)
        await this.#remote[prefix].ensureBucket();
      }
    }
    this.#logger.debug("Upload storage initialized", {
      prefixes: this.#prefixes,
      localOnly,
    });
  }

  /**
   * Output all files that would be uploaded, printing each file path to stdout
   * @returns {Promise<void>}
   */
  async output() {
    for (const prefix of this.#prefixes) {
      await this.#outputPrefix(prefix);
    }
  }

  /**
   * Upload all items from local storage to S3
   * @returns {Promise<void>}
   */
  async upload() {
    for (const prefix of this.#prefixes) {
      await this.#uploadPrefix(prefix);
    }
  }

  /**
   * Get and filter keys from a storage area, skipping hidden files for security
   * @param {string} prefix - Storage area prefix
   * @returns {Promise<string[]>} Filtered keys
   * @private
   */
  async #getKeys(prefix) {
    const local = this.#local[prefix];
    const keys = await local.list();
    // Filter out hidden files (starting with .) for security reasons
    return keys.filter((key) => !key.startsWith("."));
  }

  /**
   * Output all files from a storage area that would be uploaded, skipping hidden files
   * @param {string} prefix - Storage area prefix
   * @returns {Promise<void>}
   * @private
   */
  async #outputPrefix(prefix) {
    const local = this.#local[prefix];
    const keys = await this.#getKeys(prefix);

    for (const key of keys) {
      // Get absolute path from storage and make it relative to the initial working directory
      const absolutePath = local.path(key);
      const initialCwd = process.env.INIT_CWD || process.cwd();
      const relativePath = path.relative(initialCwd, absolutePath);
      console.log(relativePath);
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
    const keys = await this.#getKeys(prefix);

    for (const key of keys) {
      const data = await local.get(key);
      await remote.put(key, data);
    }

    this.#logger.debug("Upload completed", {
      prefix,
      uploaded: keys.length,
    });
  }
}
