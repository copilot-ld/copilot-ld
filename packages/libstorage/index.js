/* eslint-env node */
import { promises as fs } from "fs";
import { dirname, join } from "path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { StorageInterface } from "./types.js";

/**
 * Local filesystem storage implementation
 * @implements {StorageInterface}
 */
export class LocalStorage extends StorageInterface {
  #basePath;
  #fs;

  /**
   * Creates a new LocalStorage instance
   * @param {string} basePath - Base path for all storage operations
   * @param {object} fs - File system operations object
   */
  constructor(basePath, fs) {
    super();
    this.#basePath = basePath;
    this.#fs = fs;
  }

  /** @inheritdoc */
  async put(key, data) {
    const fullPath = this.#getKey(key);
    const dirToCreate = dirname(fullPath);

    await this.#fs.mkdir(dirToCreate, { recursive: true });
    await this.#fs.writeFile(fullPath, data);
  }

  /** @inheritdoc */
  async get(key) {
    return await this.#fs.readFile(this.#getKey(key));
  }

  /** @inheritdoc */
  async delete(key) {
    await this.#fs.unlink(this.#getKey(key));
  }

  /** @inheritdoc */
  async exists(key) {
    try {
      await this.#fs.access(this.#getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  async find(extension) {
    const keys = [];

    /**
     * Recursively traverse directories to find files with the specified extension
     * @param {string} currentDir - Current directory being traversed
     * @param {string} relativePath - Relative path from base path
     */
    async function traverse(currentDir, relativePath = "") {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          const relativeKey = relativePath
            ? join(relativePath, entry.name)
            : entry.name;

          if (entry.isDirectory()) {
            await traverse(fullPath, relativeKey);
          } else if (entry.isFile() && entry.name.endsWith(extension)) {
            keys.push(relativeKey);
          }
        }
      } catch (error) {
        // Ignore directories that can't be read (permission issues, etc.)
        if (error.code !== "ENOENT" && error.code !== "EACCES") {
          throw error;
        }
      }
    }

    await traverse(this.#basePath);
    return keys;
  }

  /**
   * Get full file path by combining base path and relative key
   * @param {string} key - Relative key identifier
   * @returns {string} Full file path
   * @private
   */
  #getKey(key) {
    if (key.startsWith("/")) {
      return key; // Use absolute path directly for local filesystem
    }
    return join(this.#basePath, key);
  }
}

/**
 * S3-compatible storage implementation
 * @implements {StorageInterface}
 */
export class S3Storage extends StorageInterface {
  #basePath;
  #bucket;
  #client;
  #commands;

  /**
   * Creates a new S3Storage instance
   * @param {string} basePath - Base path for all storage operations
   * @param {string} bucket - S3 bucket name
   * @param {object} client - S3 client instance
   * @param {object} commands - S3 command classes
   */
  constructor(basePath, bucket, client, commands) {
    super();
    this.#basePath = basePath;
    this.#bucket = bucket;
    this.#client = client;
    this.#commands = commands;
  }

  /** @inheritdoc */
  async put(key, data) {
    await this.#client.send(
      new this.#commands.PutObjectCommand({
        Bucket: this.#bucket,
        Key: this.#getKey(key),
        Body: data,
      }),
    );
  }

  /** @inheritdoc */
  async get(key) {
    const command = new this.#commands.GetObjectCommand({
      Bucket: this.#bucket,
      Key: this.#getKey(key),
    });

    const response = await this.#client.send(command);
    const chunks = [];

    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /** @inheritdoc */
  async delete(key) {
    await this.#client.send(
      new this.#commands.DeleteObjectCommand({
        Bucket: this.#bucket,
        Key: this.#getKey(key),
      }),
    );
  }

  /** @inheritdoc */
  async exists(key) {
    try {
      await this.#client.send(
        new this.#commands.HeadObjectCommand({
          Bucket: this.#bucket,
          Key: this.#getKey(key),
        }),
      );
      return true;
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /** @inheritdoc */
  async find(extension) {
    const keys = [];
    let continuationToken;

    do {
      const command = new this.#commands.ListObjectsV2Command({
        Bucket: this.#bucket,
        Prefix: this.#basePath,
        ContinuationToken: continuationToken,
      });

      const response = await this.#client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.endsWith(extension)) {
            const relativeKey = object.Key.startsWith(this.#basePath)
              ? object.Key.substring(this.#basePath.length).replace(/^\//, "")
              : object.Key;
            keys.push(relativeKey);
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  /**
   * Get full S3 key by combining base path and relative key
   * @param {string} key - Relative key identifier
   * @returns {string} Full S3 key
   * @private
   */
  #getKey(key) {
    if (key.startsWith("/")) {
      return key.substring(1); // Remove leading slash for S3
    }
    return `${this.#basePath}/${key}`;
  }
}

/**
 * Creates a storage instance based on environment variables
 * @param {string} basePath - Base path for all storage operations
 * @returns {StorageInterface} Storage instance
 * @throws {Error} When unsupported storage type is provided
 */
export function storageFactory(basePath) {
  const type = process.env.STORAGE_TYPE;

  switch (type) {
    case "local":
    case undefined: {
      return new LocalStorage(basePath, fs);
    }
    case "s3": {
      const client = new S3Client({
        forcePathStyle: true,
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
      });

      return new S3Storage(basePath, process.env.S3_BUCKET, client, {
        DeleteObjectCommand,
        GetObjectCommand,
        HeadObjectCommand,
        ListObjectsV2Command,
        PutObjectCommand,
      });
    }
    default:
      throw new Error(`Unsupported storage type: ${type}`);
  }
}

export { StorageInterface };
