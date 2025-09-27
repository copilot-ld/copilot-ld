/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { Logger } from "@copilot-ld/libutil";

const logger = new Logger("upload-script");

/**
 * Upload script for synchronizing local storage to S3
 */
class UploadScript {
  #prefixes;
  #local;
  #remote;

  constructor() {
    this.#prefixes = [
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
      this.#local[prefix] = storageFactory(prefix, "local");
      this.#remote[prefix] = storageFactory(prefix, "s3");

      // Ensure S3 bucket exists (single bucket with prefixes)
      logger.debug("Ensuring S3 bucket exists", { prefix });
      const created = await this.#remote[prefix].ensureBucket();
      if (created) {
        logger.debug("S3 bucket created", { prefix });
      } else {
        logger.debug("S3 bucket already exists", { prefix });
      }
    }
  }

  /**
   * Upload all items from local storage to S3
   * @returns {Promise<void>}
   */
  async upload() {
    for (const prefix of this.#prefixes) {
      logger.debug("Processing storage area", { prefix });
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

      logger.debug("Items found for upload", {
        prefix,
        total: keys.length,
        uploaded: filteredKeys.length,
        filtered: keys.length - filteredKeys.length,
      });

      for (const key of filteredKeys) {
        try {
          const data = await local.get(key);
          await remote.put(key, data);
          logger.debug("Item uploaded", { prefix, key });
        } catch (error) {
          logger.debug("Item error", { prefix, key, error: error.message });
          throw error;
        }
      }
    } catch (error) {
      logger.debug("Processing error", { prefix, error: error.message });
      throw error;
    }
  }
}

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  await ScriptConfig.create("upload-script");
  const uploader = new UploadScript();
  await uploader.initialize();
  await uploader.upload();
}

main();
