/* eslint-env node */
import { promises as fs } from "fs";
import { dirname, join } from "path";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { StorageInterface } from "./types.js";

import { logFactory, searchUpward } from "@copilot-ld/libutil";

/**
 * Parse JSON Lines (JSONL) format into an array of objects
 * @param {Buffer|string} content - Content to parse as JSON Lines
 * @returns {object[]} Array of parsed JSON objects
 */
function fromJsonLines(content) {
  const text = content.toString().trim();
  if (!text) return [];

  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

/**
 * Parse JSON format into an object
 * @param {Buffer|string} content - Content to parse as JSON
 * @returns {object} Parsed JSON object
 */
function fromJson(content) {
  const text = content.toString().trim();
  if (!text) return {};

  return JSON.parse(text);
}

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
  constructor(basePath, fs, _logFn = logFactory) {
    super();
    this.#basePath = basePath;
    this.#fs = fs;
  }

  /** @inheritdoc */
  async put(key, data) {
    const fullPath = this.path(key);
    const dirToCreate = dirname(fullPath);

    await this.#fs.mkdir(dirToCreate, { recursive: true });
    await this.#fs.writeFile(fullPath, data);
  }

  /** @inheritdoc */
  async append(key, data) {
    const fullPath = this.path(key);
    const dirToCreate = dirname(fullPath);

    await this.#fs.mkdir(dirToCreate, { recursive: true });

    // Always append with newline for JSON-ND format consistency
    const dataWithNewline = data.toString().endsWith("\n") ? data : data + "\n";
    await this.#fs.appendFile(fullPath, dataWithNewline);
  }

  /** @inheritdoc */
  async get(key) {
    const content = await this.#fs.readFile(this.path(key));

    // Parse JSON Lines format if file has .jsonl extension
    if (key.endsWith(".jsonl")) {
      return fromJsonLines(content);
    }

    // Parse JSON format if file has .json extension
    if (key.endsWith(".json")) {
      return fromJson(content);
    }

    return content;
  }

  /** @inheritdoc */
  async delete(key) {
    await this.#fs.unlink(this.path(key));
  }

  /** @inheritdoc */
  async exists(key) {
    try {
      await this.#fs.access(this.path(key));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recursively traverse directories to find files matching a filter
   * @private
   * @param {Function|null} fileFilter - Optional filter function for files
   * @returns {Promise<string[]>} Array of relative file paths
   */
  async #traverse(fileFilter = null) {
    const keys = [];

    /**
     * Recursively traverse directories
     * @param {string} currentDir - Current directory being traversed
     * @param {string} relativePath - Relative path from base path
     */
    const traverse = async (currentDir, relativePath = "") => {
      try {
        const entries = await this.#fs.readdir(currentDir, {
          withFileTypes: true,
        });

        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          const relativeKey = relativePath
            ? join(relativePath, entry.name)
            : entry.name;

          if (entry.isDirectory()) {
            await traverse(fullPath, relativeKey);
          } else if (entry.isFile()) {
            if (!fileFilter || fileFilter(relativeKey)) {
              keys.push(relativeKey);
            }
          }
        }
      } catch (error) {
        // Ignore directories that can't be read (permission issues, etc.)
        if (error.code !== "ENOENT" && error.code !== "EACCES") {
          throw error;
        }
      }
    };

    await traverse(this.#basePath);
    return keys;
  }

  /** @inheritdoc */
  async findByExtension(extension) {
    return await this.#traverse((filename) => filename.endsWith(extension));
  }

  /** @inheritdoc */
  async getMany(keys) {
    const results = {};
    await Promise.all(
      keys.map(async (key) => {
        try {
          const data = await this.get(key);
          results[key] = data;
        } catch (error) {
          // If key doesn't exist, skip it (don't add to results)
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }),
    );
    return results;
  }

  /** @inheritdoc */
  async findByPrefix(prefix) {
    return await this.#traverse((filename) => filename.startsWith(prefix));
  }

  /** @inheritdoc */
  async list() {
    return await this.#traverse();
  }

  /** @inheritdoc */
  path(key) {
    if (key.startsWith("/")) {
      return key; // Use absolute path directly for local filesystem
    }
    return join(this.#basePath, key);
  }

  /** @inheritdoc */
  async ensureBucket() {
    try {
      await this.#fs.access(this.#basePath);
      return false; // Directory already exists
    } catch {
      await this.#fs.mkdir(this.#basePath, { recursive: true });
      return true; // Directory was created
    }
  }

  /** @inheritdoc */
  async bucketExists() {
    try {
      await this.#fs.access(this.#basePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * S3-compatible storage implementation
 * @implements {StorageInterface}
 */
export class S3Storage extends StorageInterface {
  #bucket;
  #client;
  #commands;

  /**
   * Creates a new S3Storage instance
   * @param {string} bucket - S3 bucket name
   * @param {object} client - S3 client instance
   * @param {object} commands - S3 command classes
   */
  constructor(bucket, client, commands) {
    super();
    this.#bucket = bucket;
    this.#client = client;
    this.#commands = commands;
  }

  /** @inheritdoc */
  async put(key, data) {
    await this.#client.send(
      new this.#commands.PutObjectCommand({
        Bucket: this.#bucket,
        Key: this.path(key),
        Body: data,
      }),
    );
  }

  /** @inheritdoc */
  async append(key, data) {
    let existingData = Buffer.alloc(0);

    try {
      const result = await this.#getRaw(key);
      existingData = result;
    } catch (error) {
      // If key doesn't exist, start with empty data
      if (
        error.name !== "NoSuchKey" &&
        error.$metadata?.httpStatusCode !== 404
      ) {
        throw error;
      }
    }

    // Always append with newline for JSON-ND format consistency
    const dataWithNewline = data.toString().endsWith("\n") ? data : data + "\n";
    const newData = Buffer.concat([existingData, Buffer.from(dataWithNewline)]);
    await this.put(key, newData);
  }

  /**
   * Get raw data without JSON Lines parsing
   * @param {string} key - Storage key identifier
   * @returns {Promise<Buffer>} Raw buffer data
   * @private
   */
  async #getRaw(key) {
    const command = new this.#commands.GetObjectCommand({
      Bucket: this.#bucket,
      Key: this.path(key),
    });

    const response = await this.#client.send(command);
    const chunks = [];

    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /** @inheritdoc */
  async get(key) {
    const command = new this.#commands.GetObjectCommand({
      Bucket: this.#bucket,
      Key: this.path(key),
    });

    const response = await this.#client.send(command);
    const chunks = [];

    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    const content = Buffer.concat(chunks);

    // Parse JSON Lines format if file has .jsonl extension
    if (key.endsWith(".jsonl")) {
      return fromJsonLines(content);
    }

    // Parse JSON format if file has .json extension
    if (key.endsWith(".json")) {
      return fromJson(content);
    }

    return content;
  }

  /** @inheritdoc */
  async delete(key) {
    await this.#client.send(
      new this.#commands.DeleteObjectCommand({
        Bucket: this.#bucket,
        Key: this.path(key),
      }),
    );
  }

  /** @inheritdoc */
  async exists(key) {
    try {
      await this.#client.send(
        new this.#commands.HeadObjectCommand({
          Bucket: this.#bucket,
          Key: this.path(key),
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
  async findByExtension(extension) {
    const keys = [];
    let continuationToken;

    do {
      const command = new this.#commands.ListObjectsV2Command({
        Bucket: this.#bucket,
        ContinuationToken: continuationToken,
      });

      const response = await this.#client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.endsWith(extension)) {
            keys.push(object.Key);
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  /** @inheritdoc */
  async getMany(keys) {
    const results = {};
    await Promise.all(
      keys.map(async (key) => {
        try {
          const data = await this.get(key);
          results[key] = data;
        } catch (error) {
          // If key doesn't exist, skip it (don't add to results)
          if (
            error.name !== "NoSuchKey" &&
            error.$metadata?.httpStatusCode !== 404
          ) {
            throw error;
          }
        }
      }),
    );
    return results;
  }

  /** @inheritdoc */
  async findByPrefix(prefix) {
    const keys = [];
    let continuationToken;

    do {
      const command = new this.#commands.ListObjectsV2Command({
        Bucket: this.#bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.#client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            keys.push(object.Key);
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  /** @inheritdoc */
  async list() {
    const keys = [];
    let continuationToken;

    do {
      const command = new this.#commands.ListObjectsV2Command({
        Bucket: this.#bucket,
        ContinuationToken: continuationToken,
      });

      const response = await this.#client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            keys.push(object.Key);
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  /** @inheritdoc */
  path(key) {
    if (key.startsWith("/")) {
      // For absolute paths, remove leading slash
      return key.substring(1);
    }
    // For relative paths, use key as-is
    return key;
  }

  /** @inheritdoc */
  async ensureBucket() {
    try {
      await this.#client.send(
        new this.#commands.HeadBucketCommand({
          Bucket: this.#bucket,
        }),
      );
      return false; // Bucket already exists
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404 ||
        error.Code === "NoSuchBucket"
      ) {
        await this.#client.send(
          new this.#commands.CreateBucketCommand({
            Bucket: this.#bucket,
          }),
        );
        return true; // Bucket was created
      }
      throw error;
    }
  }

  /** @inheritdoc */
  async bucketExists() {
    try {
      await this.#client.send(
        new this.#commands.HeadBucketCommand({
          Bucket: this.#bucket,
        }),
      );
      return true;
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404 ||
        error.Code === "NoSuchBucket"
      ) {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Creates a storage instance based on environment variables
 * @param {string} bucket - Bucket for the storage operations
 * @param {string} type - Storage type ("local" or "s3")
 * @param {object} process - Process environment access (for testing)
 * @returns {StorageInterface} Storage instance
 * @throws {Error} When unsupported storage type is provided
 * @todo Clean this up with dedicated factories for each bucket type.
 */
export function storageFactory(bucket, type, process = global.process) {
  const finalType = type || process.env.STORAGE_TYPE || "local";

  switch (finalType) {
    case "local":
    case undefined: {
      let relative;

      switch (bucket) {
        case "config":
          relative = bucket;
          break;

        case "proto":
          relative = join("generated", bucket);
          break;

        case "knowledge":
          relative = join("data", bucket);
          break;

        default:
          relative = join("data", "storage", bucket);
      }

      const root =
        typeof process.cwd === "function"
          ? process.cwd()
          : global.process.cwd();

      const basePath = searchUpward(root, relative);

      if (!basePath) {
        throw new Error(`Could not find bucket: ${bucket}`);
      }

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

      return new S3Storage(bucket, client, {
        CreateBucketCommand,
        DeleteObjectCommand,
        GetObjectCommand,
        HeadBucketCommand,
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
