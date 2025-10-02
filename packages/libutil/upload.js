/* eslint-env node */

/**
 * Upload utility for synchronizing local storage to remote storage
 * Implements object-oriented approach with dependency injection
 */
export class Upload {
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
      await this.#remote[prefix].ensureBucket();
    }
    this.#logger.debug("Upload storage initialized", {
      prefixes: this.#prefixes,
    });
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
   * Upload all items from a storage area, skipping hidden files
   * @param {string} prefix - Storage area prefix
   * @returns {Promise<void>}
   * @private
   */
  async #uploadPrefix(prefix) {
    const local = this.#local[prefix];
    const remote = this.#remote[prefix];

    const keys = await local.list();
    const filteredKeys = keys.filter((key) => !key.startsWith("."));

    for (const key of filteredKeys) {
      const data = await local.get(key);
      await remote.put(key, data);
    }

    this.#logger.debug("Upload completed", {
      prefix,
      uploaded: filteredKeys.length,
      filtered: keys.length - filteredKeys.length,
    });
  }
}
