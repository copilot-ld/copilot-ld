/* eslint-env node */
import { DownloadInterface } from "./types.js";

/**
 * Download utility for retrieving and extracting bundle.tar.gz from remote storage
 * Implements object-oriented approach with dependency injection
 */
export class Download extends DownloadInterface {
  #storageFactory;
  #execFn;
  #logger;
  #local;
  #remote;

  /**
   * Creates a new download instance with dependency injection
   * @param {Function} storageFn - Storage factory function
   * @param {Function} execFn - Execution function for system commands
   * @param {object} logger - Logger instance
   */
  constructor(storageFn, execFn, logger) {
    super();
    if (!storageFn) throw new Error("storageFn is required");
    if (!execFn) throw new Error("execFn is required");
    if (!logger) throw new Error("logger is required");

    this.#storageFactory = storageFn;
    this.#execFn = execFn;
    this.#logger = logger;
    this.#local = null;
    this.#remote = null;
  }

  /**
   * Initialize storage instances for download operations
   * @returns {Promise<void>}
   */
  async initialize() {
    // Initialize storage instances for the "generated" prefix
    this.#local = this.#storageFactory("generated", "local");
    this.#remote = this.#storageFactory("generated", "s3");

    // Ensure local directory exists
    await this.#local.ensureBucket();
    this.#logger.debug("Download storage initialized", { prefix: "generated" });
  }

  /**
   * Download bundle.tar.gz from remote storage and extract to local storage
   * @returns {Promise<void>}
   */
  async download() {
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
   * Extract bundle.tar.gz to local storage using system tar command
   * @param {string} bundleKey - Bundle file key in local storage
   * @returns {Promise<void>}
   * @private
   */
  async #extractBundle(bundleKey) {
    const bundlePath = this.#local.path(bundleKey);
    const extractDir = this.#local.path(".");

    this.#execFn(`tar -xzf "${bundlePath}" -C "${extractDir}"`, {
      stdio: "pipe",
    });
  }
}
