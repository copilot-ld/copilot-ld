/* eslint-env node */
import { execSync } from "node:child_process";
import { DownloadInterface } from "./types.js";

/**
 * Download utility for retrieving and extracting bundle.tar.gz from remote storage
 * Implements object-oriented approach with dependency injection
 */
export class Download extends DownloadInterface {
  #storageFactory;
  #logger;
  #local;
  #remote;

  /**
   * Creates a new download instance with dependency injection
   * @param {Function} storageFactory - Storage factory function
   * @param {object} logger - Logger instance
   */
  constructor(storageFactory, logger) {
    super();
    if (!storageFactory) throw new Error("storageFactory is required");
    if (!logger) throw new Error("logger is required");

    this.#storageFactory = storageFactory;
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
    this.#logger.debug("Ensuring local storage directory exists", { prefix: "generated" });
    const created = await this.#local.ensureBucket();
    if (created) {
      this.#logger.debug("Local directory created", { prefix: "generated" });
    } else {
      this.#logger.debug("Local directory already exists", { prefix: "generated" });
    }
  }

  /**
   * Download bundle.tar.gz from remote storage and extract to local storage
   * @returns {Promise<void>}
   */
  async download() {
    const bundleKey = "bundle.tar.gz";
    
    try {
      // Check if bundle exists in remote storage
      const exists = await this.#remote.exists(bundleKey);
      if (!exists) {
        this.#logger.debug("Bundle not found in remote storage", { key: bundleKey });
        return;
      }

      this.#logger.debug("Downloading bundle from remote storage", { key: bundleKey });
      
      // Download bundle.tar.gz from remote storage
      const bundleData = await this.#remote.get(bundleKey);
      
      // Write bundle to local storage
      await this.#local.put(bundleKey, bundleData);
      
      this.#logger.debug("Bundle downloaded successfully", { key: bundleKey });
      
      // Extract bundle.tar.gz using local storage path
      await this.#extractBundle(bundleKey);
      
      // Clean up the bundle file after extraction
      await this.#local.delete(bundleKey);
      this.#logger.debug("Bundle cleaned up after extraction", { key: bundleKey });
      
    } catch (error) {
      this.#logger.debug("Download failed", { 
        key: bundleKey, 
        error: error.message 
      });
      throw error;
    }
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

    this.#logger.debug("Extracting bundle", { 
      bundle: bundlePath, 
      extractDir 
    });

    try {
      // Extract tar.gz archive using system tar command
      execSync(`tar -xzf "${bundlePath}" -C "${extractDir}"`, {
        stdio: "pipe",
      });

      this.#logger.debug("Bundle extracted successfully", { 
        bundle: bundlePath,
        extractDir 
      });
    } catch (error) {
      this.#logger.debug("Bundle extraction failed", { 
        bundle: bundlePath,
        extractDir,
        error: error.message 
      });
      throw new Error(`Failed to extract bundle: ${error.message}`);
    }
  }
}