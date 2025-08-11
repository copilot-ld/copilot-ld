/* eslint-env node */
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { config } from "dotenv";

// Load environment variables
config();

/**
 * MinIO initialization script to create buckets and upload existing storage files
 */
class MinIOInitializer {
  #client;
  #basePath;

  constructor(endpoint, accessKey, secretKey, basePath) {
    this.#client = new S3Client({
      endpoint,
      region: "us-east-1",
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });
    this.#basePath = basePath;
  }

  /**
   * Initialize MinIO with buckets and existing files
   * @returns {Promise<void>}
   */
  async initialize() {
    const buckets = ["scope", "vectors", "chunks"];

    for (const bucket of buckets) {
      await this.#createBucket(bucket);
      await this.#uploadDirectoryFiles(bucket);
    }
  }

  /**
   * Create a bucket if it doesn't exist
   * @param {string} bucketName - Name of the bucket to create
   * @returns {Promise<void>}
   * @private
   */
  async #createBucket(bucketName) {
    try {
      await this.#client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Created bucket: ${bucketName}`);
    } catch (error) {
      if (error.name === "BucketAlreadyOwnedByYou") {
        console.log(`Bucket already exists: ${bucketName}`);
      } else {
        console.error(`Error creating bucket ${bucketName}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Upload all files from a directory to the corresponding bucket
   * @param {string} bucketName - Name of the bucket
   * @returns {Promise<void>}
   * @private
   */
  async #uploadDirectoryFiles(bucketName) {
    const directoryPath = join(this.#basePath, bucketName);

    try {
      await this.#uploadDirectory(bucketName, directoryPath, "");
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(
          `Directory ${directoryPath} does not exist, skipping upload`,
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Recursively upload directory contents
   * @param {string} bucketName - Name of the bucket
   * @param {string} dirPath - Path to directory
   * @param {string} prefix - S3 key prefix
   * @returns {Promise<void>}
   * @private
   */
  async #uploadDirectory(bucketName, dirPath, prefix) {
    const entries = await readdir(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const key = prefix ? `${prefix}/${entry}` : entry;
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        await this.#uploadDirectory(bucketName, fullPath, key);
      } else if (stats.isFile()) {
        await this.#uploadFile(bucketName, fullPath, key);
      }
    }
  }

  /**
   * Upload a single file to MinIO
   * @param {string} bucketName - Name of the bucket
   * @param {string} filePath - Path to the file
   * @param {string} key - S3 object key
   * @returns {Promise<void>}
   * @private
   */
  async #uploadFile(bucketName, filePath, key) {
    try {
      const fileContent = await readFile(filePath);

      await this.#client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: this.#getContentType(filePath),
        }),
      );

      console.log(`Uploaded: ${bucketName}/${key}`);
    } catch (error) {
      console.error(
        `Error uploading ${filePath} to ${bucketName}/${key}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Get content type based on file extension
   * @param {string} filePath - File path
   * @returns {string} Content type
   * @private
   */
  #getContentType(filePath) {
    if (filePath.endsWith(".json")) {
      return "application/json";
    }
    return "application/octet-stream";
  }

  /**
   * List objects in a bucket for verification
   * @param {string} bucketName - Name of the bucket
   * @returns {Promise<void>}
   */
  async listObjects(bucketName) {
    try {
      const response = await this.#client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
        }),
      );

      console.log(`Objects in ${bucketName}:`);
      if (response.Contents) {
        for (const object of response.Contents) {
          console.log(`  - ${object.Key} (${object.Size} bytes)`);
        }
      } else {
        console.log("  (empty)");
      }
    } catch (error) {
      console.error(`Error listing objects in ${bucketName}:`, error.message);
    }
  }
}

/**
 * Main execution function for MinIO initialization
 * Initializes MinIO server with existing storage files and verifies the setup
 * @returns {Promise<void>}
 */
async function main() {
  const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
  const accessKey = process.env.MINIO_ROOT_USER || "minioadmin";
  const secretKey = process.env.MINIO_ROOT_PASSWORD || "minioadmin";
  const basePath = process.env.MINIO_INIT_DATA_PATH || "data/storage";

  console.log(`Connecting to MinIO at ${endpoint} with user: ${accessKey}`);

  const initializer = new MinIOInitializer(
    endpoint,
    accessKey,
    secretKey,
    basePath,
  );

  try {
    console.log("Initializing MinIO with existing storage files...");
    await initializer.initialize();

    console.log("\nVerification - listing objects:");
    await initializer.listObjects("scope");
    await initializer.listObjects("vectors");
    await initializer.listObjects("chunks");

    console.log("\nMinIO initialization completed successfully!");
  } catch (error) {
    console.error("MinIO initialization failed:", error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MinIOInitializer };
