/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { Logger } from "@copilot-ld/libutil";

const logger = new Logger("upload-script");

/**
 * Upload script for synchronizing local storage to S3
 */
class UploadScript {
  #local;
  #remote;

  constructor() {
    this.#local = {};
    this.#remote = {};
  }

  /**
   * Initialize storage instances for all buckets
   * @returns {Promise<void>}
   */
  async initialize() {
    const buckets = ["config", "memories", "policies", "resources", "vectors"];

    for (const bucket of buckets) {
      this.#local[bucket] = storageFactory(bucket, "local");
      this.#remote[bucket] = storageFactory(bucket, "s3");

      // Ensure S3 bucket exists using the new bucket management method
      logger.debug("Ensuring bucket exists", { bucket });
      const created = await this.#remote[bucket].ensureBucket();
      if (created) {
        logger.debug("Bucket created", { bucket });
      } else {
        logger.debug("Bucket already exists", { bucket });
      }
    }
  }

  /**
   * Upload all items from local storage to S3
   * @returns {Promise<void>}
   */
  async upload() {
    const buckets = ["config", "memories", "policies", "resources", "vectors"];

    for (const bucket of buckets) {
      logger.debug("Processing bucket", { bucket });
      await this.#uploadBucket(bucket);
    }
  }

  /**
   * Upload all items from a bucket, skipping hidden files
   * @param {string} bucket - Bucket name
   * @returns {Promise<void>}
   * @private
   */
  async #uploadBucket(bucket) {
    const local = this.#local[bucket];
    const remote = this.#remote[bucket];

    try {
      const keys = await local.list();

      // Filter out hidden files (starting with ".")
      const filteredKeys = keys.filter((key) => !key.startsWith("."));

      logger.debug("Items found for upload", {
        bucket,
        total: keys.length,
        uploaded: filteredKeys.length,
        filtered: keys.length - filteredKeys.length,
      });

      for (const key of filteredKeys) {
        try {
          const data = await local.get(key);
          await remote.put(key, data);
          logger.debug("Item uploaded", { bucket, key });
        } catch (error) {
          logger.debug("Item error", { bucket, key, error: error.message });
          throw error;
        }
      }
    } catch (error) {
      logger.debug("Processing error", { bucket, error: error.message });
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
