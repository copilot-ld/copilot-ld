/* eslint-env node */

/**
 * Downloader utility for retrieving and extracting bundle.tar.gz from remote storage
 * Implements object-oriented approach with dependency injection
 */
export class Downloader {
  #storageFactory;
  #finder;
  #logger;
  #extractor;
  #process;
  #local;
  #remote;
  #initialized;

  /**
   * Creates a new download instance with dependency injection
   * @param {Function} storageFn - Storage factory function
   * @param {object} finder - Finder instance for symlink management
   * @param {object} logger - Logger instance
   * @param {object} extractor - TarExtractor instance for archive extraction
   * @param {object} process - Process environment access (for testing)
   */
  constructor(storageFn, finder, logger, extractor, process = global.process) {
    if (!storageFn) throw new Error("storageFn is required");
    if (!finder) throw new Error("finder is required");
    if (!logger) throw new Error("logger is required");
    if (!extractor) throw new Error("extractor is required");
    if (!process) throw new Error("process is required");

    this.#storageFactory = storageFn;
    this.#finder = finder;
    this.#logger = logger;
    this.#extractor = extractor;
    this.#process = process;
    this.#local = null;
    this.#remote = null;
    this.#initialized = false;
  }

  /**
   * Initialize storage instances for download operations
   * @returns {Promise<void>}
   */
  async initialize() {
    // Initialize storage instances for the "generated" prefix
    this.#local = this.#storageFactory("generated", "local", this.#process);
    this.#remote = this.#storageFactory("generated", "s3", this.#process);

    // Ensure directory and create symlinks for packages
    await this.#local.ensureBucket();
    const generatedPath = this.#local.path();
    await this.#finder.createPackageSymlinks(generatedPath);

    this.#initialized = true;
  }

  /**
   * Download bundle.tar.gz from remote storage and extract to local storage
   * Only downloads if STORAGE_TYPE is "s3"
   * Automatically initializes storage instances if not already initialized
   * @returns {Promise<void>}
   */
  async download() {
    // Auto-initialize if not already initialized
    if (!this.#initialized) await this.initialize();

    const storageType = this.#process.env.STORAGE_TYPE || "local";

    if (storageType === "local") {
      this.#logger.debug("Download skipped, using local storage");
      return;
    }

    const bundleKey = "bundle.tar.gz";

    // Check if bundle exists in remote storage
    const exists = await this.#remote.exists(bundleKey);
    if (!exists) throw new Error(`Bundle not found`);

    const bundleData = await this.#remote.get(bundleKey);
    await this.#local.put(bundleKey, bundleData);
    await this.#extractBundle(bundleKey);
    await this.#local.delete(bundleKey);

    this.#logger.debug("Download completed", { key: bundleKey });
  }

  /**
   * Extract bundle.tar.gz to local storage using TarExtractor
   * @param {string} bundleKey - Bundle file key in local storage
   * @returns {Promise<void>}
   * @private
   */
  async #extractBundle(bundleKey) {
    const bundlePath = this.#local.path(bundleKey);
    const extractDir = this.#local.path();

    await this.#extractor.extract(bundlePath, extractDir);
  }
}
