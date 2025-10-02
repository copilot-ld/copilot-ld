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
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";

import { searchUpward, generateUUID } from "@copilot-ld/libutil";

/**
 * Base interface for storage implementations
 */
export class StorageInterface {
  /**
   * Store data with the given key
   * @param {string} _key - Storage key identifier
   * @param {string|Buffer|object} _data - Data to store
   * @returns {Promise<void>}
   * @throws {Error} When storage operation fails
   */
  async put(_key, _data) {
    throw new Error("StorageInterface.put() not implemented");
  }

  /**
   * Retrieve data by key
   * @param {string} _key - Storage key identifier
   * @returns {Promise<any>} Retrieved data
   * @throws {Error} When retrieval fails
   */
  async get(_key) {
    throw new Error("StorageInterface.get() not implemented");
  }

  /**
   * Remove data by key
   * @param {string} _key - Storage key identifier
   * @returns {Promise<void>}
   * @throws {Error} When deletion fails
   */
  async delete(_key) {
    throw new Error("StorageInterface.delete() not implemented");
  }

  /**
   * Check if key exists
   * @param {string} _key - Storage key identifier
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(_key) {
    throw new Error("StorageInterface.exists() not implemented");
  }

  /**
   * Append data to an existing key
   * @param {string} _key - Storage key identifier
   * @param {string|Buffer} _data - Data to append
   * @returns {Promise<void>}
   * @throws {Error} When append fails
   */
  async append(_key, _data) {
    throw new Error("StorageInterface.append() not implemented");
  }

  /**
   * Retrieve multiple items by their keys
   * @param {string[]} _keys - Array of storage key identifiers
   * @returns {Promise<object>} Object with key-value pairs
   */
  async getMany(_keys) {
    throw new Error("StorageInterface.getMany() not implemented");
  }

  /**
   * Lists all keys in storage
   * @returns {Promise<string[]>} Array of keys
   */
  async list() {
    throw new Error("StorageInterface.list() not implemented");
  }

  /**
   * Find keys with specified prefix
   * @param {string} _prefix - Key prefix to match
   * @returns {Promise<string[]>} Array of matching keys
   */
  async findByPrefix(_prefix) {
    throw new Error("StorageInterface.findByPrefix() not implemented");
  }

  /**
   * Find keys with specified extension
   * @param {string} _extension - File extension to search for
   * @returns {Promise<string[]>} Array of keys with the extension
   */
  async findByExtension(_extension) {
    throw new Error("StorageInterface.findByExtension() not implemented");
  }

  /**
   * Gets the path for a storage key
   * @param {string} _key - Storage key identifier
   * @returns {string} Key path
   */
  path(_key) {
    return "";
  }
}

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
 * Convert array of objects to JSON Lines (JSONL) format
 * @param {object[]} data - Array of objects to convert to JSONL
 * @returns {string} JSONL formatted string
 */
function toJsonLines(data) {
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array for JSONL format");
  }
  return data.map((item) => JSON.stringify(item)).join("\n") + "\n";
}

/**
 * Convert object to JSON format
 * @param {object} data - Object to convert to JSON
 * @returns {string} JSON formatted string
 */
function toJson(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Check if key represents a JSON Lines file and data is an array
 * @param {string} key - Storage key identifier
 * @param {*} data - Data to check
 * @returns {boolean} True if this should be serialized as JSONL
 */
function isJsonLines(key, data) {
  return key.endsWith(".jsonl") && Array.isArray(data);
}

/**
 * Check if key represents a JSON file and data is an object
 * @param {string} key - Storage key identifier
 * @param {*} data - Data to check
 * @returns {boolean} True if this should be serialized as JSON
 */
function isJson(key, data) {
  return (
    key.endsWith(".json") &&
    typeof data === "object" &&
    data !== null &&
    !Buffer.isBuffer(data)
  );
}

/**
 * Local filesystem storage implementation
 */
export class LocalStorage extends StorageInterface {
  #prefix;
  #fs;

  /**
   * Creates a new LocalStorage instance
   * @param {string} prefix - Base path for all storage operations
   * @param {object} fs - File system operations object
   */
  constructor(prefix, fs) {
    super();
    this.#prefix = prefix;
    this.#fs = fs;
  }

  // Core CRUD Operations

  /**
   * Store data with the given key
   * @param {string} key - Storage key identifier
   * @param {string|Buffer|object} data - Data to store
   * @returns {Promise<void>}
   */
  async put(key, data) {
    const fullPath = this.path(key);
    const dirToCreate = dirname(fullPath);
    let serializedData = data;

    // Serialize JavaScript objects back to their appropriate format for storage
    if (isJsonLines(key, data)) {
      serializedData = toJsonLines(data);
    } else if (isJson(key, data)) {
      serializedData = toJson(data);
    }

    await this.#fs.mkdir(dirToCreate, { recursive: true });
    await this.#fs.writeFile(fullPath, serializedData);
  }

  /**
   * Retrieve data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<any>} Retrieved data
   */
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

  /**
   * Remove data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<void>}
   */
  async delete(key) {
    await this.#fs.unlink(this.path(key));
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key identifier
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      await this.#fs.access(this.path(key));
      return true;
    } catch {
      return false;
    }
  }

  // Advanced Operations

  /**
   * Append data to an existing key with automatic newline
   * @param {string} key - Storage key identifier
   * @param {string|Buffer} data - Data to append
   * @returns {Promise<void>}
   */
  async append(key, data) {
    const fullPath = this.path(key);
    const dirToCreate = dirname(fullPath);

    await this.#fs.mkdir(dirToCreate, { recursive: true });

    // Always append with newline for JSON-ND format consistency
    const dataWithNewline = data.toString().endsWith("\n") ? data : data + "\n";
    await this.#fs.appendFile(fullPath, dataWithNewline);
  }

  /**
   * Retrieve multiple items by their keys
   * @param {string[]} keys - Array of storage key identifiers
   * @returns {Promise<object>} Object with key-value pairs
   */
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

  // Search and Listing Operations

  /**
   * Lists all keys in storage
   * @returns {Promise<string[]>} Array of keys
   */
  async list() {
    return await this.#traverse();
  }

  /**
   * Find keys with specified prefix
   * @param {string} prefix - Key prefix to match
   * @returns {Promise<string[]>} Array of matching keys
   */
  async findByPrefix(prefix) {
    return await this.#traverse((filename) => filename.startsWith(prefix));
  }

  /**
   * Find keys with specified extension
   * @param {string} extension - File extension to search for
   * @returns {Promise<string[]>} Array of keys with the extension
   */
  async findByExtension(extension) {
    return await this.#traverse((filename) => filename.endsWith(extension));
  }

  // Path Utilities

  /**
   * Gets the full file path for a storage key
   * @param {string} key - Storage key identifier
   * @returns {string} Full file path
   */
  path(key) {
    if (key.startsWith("/")) {
      return key; // Use absolute path directly for local filesystem
    }
    return join(this.#prefix, key);
  }

  // Bucket/Directory Management

  /**
   * Ensures the storage bucket/directory exists
   * @returns {Promise<boolean>} True if directory was created
   */
  async ensureBucket() {
    try {
      await this.#fs.access(this.#prefix);
      return false; // Directory already exists
    } catch {
      await this.#fs.mkdir(this.#prefix, { recursive: true });
      return true; // Directory was created
    }
  }

  /**
   * Checks if the storage bucket/directory exists
   * @returns {Promise<boolean>} True if directory exists
   */
  async bucketExists() {
    try {
      await this.#fs.access(this.#prefix);
      return true;
    } catch {
      return false;
    }
  }

  // Private Helper Methods

  /**
   * Recursively traverse directories to find files matching a filter
   * @private
   * @param {Function|null} fileFilter - Optional filter function for files
   * @returns {Promise<string[]>} Array of relative file paths sorted by creation timestamp (oldest first)
   */
  async #traverse(fileFilter = null) {
    const filesWithStats = [];

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
              const stats = await this.#fs.stat(fullPath);
              filesWithStats.push({
                key: relativeKey,
                birthtime: stats.birthtime || stats.mtime || new Date(0),
              });
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

    await traverse(this.#prefix);

    // Sort by creation timestamp (oldest first)
    filesWithStats.sort(
      (a, b) => a.birthtime.getTime() - b.birthtime.getTime(),
    );

    return filesWithStats.map((file) => file.key);
  }
}

/**
 * S3-compatible storage implementation
 */
export class S3Storage extends StorageInterface {
  #bucket;
  #prefix;
  #client;
  #commands;

  /**
   * Creates a new S3Storage instance
   * @param {string} prefix - Prefix for all storage operations
   * @param {string} bucket - S3 bucket name
   * @param {object} client - S3 client instance
   * @param {object} commands - S3 command classes
   */
  constructor(prefix, bucket, client, commands) {
    super();
    this.#prefix = prefix;
    this.#bucket = bucket;
    this.#client = client;
    this.#commands = commands;
  }

  // Core CRUD Operations

  /**
   * Store data with the given key
   * @param {string} key - Storage key identifier
   * @param {string|Buffer|object} data - Data to store
   * @returns {Promise<void>}
   */
  async put(key, data) {
    let bodyData = data;

    // Serialize JavaScript objects back to their appropriate format for storage
    if (isJsonLines(key, data)) {
      bodyData = toJsonLines(data);
    } else if (isJson(key, data)) {
      bodyData = toJson(data);
    }

    await this.#client.send(
      new this.#commands.PutObjectCommand({
        Bucket: this.#bucket,
        Key: this.path(key),
        Body: bodyData,
      }),
    );
  }

  /**
   * Retrieve data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<any>} Retrieved data
   */
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

  /**
   * Remove data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<void>}
   */
  async delete(key) {
    await this.#client.send(
      new this.#commands.DeleteObjectCommand({
        Bucket: this.#bucket,
        Key: this.path(key),
      }),
    );
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key identifier
   * @returns {Promise<boolean>} True if key exists
   */
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

  // Advanced Operations

  /**
   * Append data to an existing key with automatic newline
   * @param {string} key - Storage key identifier
   * @param {string|Buffer} data - Data to append
   * @returns {Promise<void>}
   */
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
   * Retrieve multiple items by their keys
   * @param {string[]} keys - Array of storage key identifiers
   * @returns {Promise<object>} Object with key-value pairs
   */
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

  // Search and Listing Operations

  /**
   * Lists all keys in storage
   * @returns {Promise<string[]>} Array of keys
   */
  async list() {
    return await this.#traverse();
  }

  /**
   * Find keys with specified prefix
   * @param {string} prefix - Key prefix to match
   * @returns {Promise<string[]>} Array of matching keys
   */
  async findByPrefix(prefix) {
    return await this.#traverse({ Prefix: `${this.#prefix}/${prefix}` });
  }

  /**
   * Find keys with specified extension
   * @param {string} extension - File extension to search for
   * @returns {Promise<string[]>} Array of keys with the extension
   */
  async findByExtension(extension) {
    return await this.#traverse({}, (key) => key.endsWith(extension));
  }

  // Path Utilities

  /**
   * Gets the path for a storage key
   * @param {string} key - Storage key identifier
   * @returns {string} Key path
   */
  path(key) {
    let cleanKey = key;
    if (key.startsWith("/")) {
      // For absolute paths, remove leading slash
      cleanKey = key.substring(1);
    }
    // Prepend prefix to create the full S3 key
    return `${this.#prefix}/${cleanKey}`;
  }

  // Bucket Management

  /**
   * Ensures the storage bucket exists
   * @returns {Promise<boolean>} True if bucket was created
   */
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

  /**
   * Checks if the storage bucket exists
   * @returns {Promise<boolean>} True if bucket exists
   */
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

  // Private Helper Methods

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

  /**
   * Recursively list objects in S3 bucket with optional filtering
   * @private
   * @param {object} [options] - S3 ListObjectsV2 command options
   * @param {Function|null} [keyFilter] - Optional filter function for keys
   * @returns {Promise<string[]>} Array of object keys sorted by creation timestamp (oldest first)
   */
  async #traverse(options = {}, keyFilter = null) {
    const objectsWithTimestamps = [];
    let continuationToken;

    // Add prefix to the S3 list query
    const listOptions = {
      Prefix: `${this.#prefix}/`,
      ...options,
    };

    do {
      const command = new this.#commands.ListObjectsV2Command({
        Bucket: this.#bucket,
        ContinuationToken: continuationToken,
        ...listOptions,
      });

      const response = await this.#client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            // Strip the prefix from the key to maintain API compatibility
            const strippedKey = object.Key.substring(`${this.#prefix}/`.length);
            if (!keyFilter || keyFilter(strippedKey)) {
              objectsWithTimestamps.push({
                key: strippedKey,
                lastModified: object.LastModified || new Date(0),
              });
            }
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Sort by creation timestamp (oldest first)
    // Note: S3 uses LastModified as the closest approximation to creation time
    objectsWithTimestamps.sort(
      (a, b) => a.lastModified.getTime() - b.lastModified.getTime(),
    );

    return objectsWithTimestamps.map((object) => object.key);
  }
}

/**
 * Creates a storage instance based on environment variables
 * @param {string} prefix - Prefix for the storage operations (for S3) or bucket/directory name (for local)
 * @param {string} type - Storage type ("local" or "s3")
 * @param {object} process - Process environment access (for testing)
 * @returns {object} Storage instance
 * @throws {Error} When unsupported storage type is provided
 * @todo Clean this up with dedicated factories for each bucket type.
 */
export function storageFactory(prefix, type, process = global.process) {
  const finalType = type || process.env.STORAGE_TYPE || "local";

  switch (finalType) {
    case "local":
    case undefined: {
      let relative;

      switch (prefix) {
        case "config":
        case "generated":
          relative = prefix;
          break;

        default:
          relative = join("data", prefix);
          break;
      }

      const root =
        typeof process.cwd === "function"
          ? process.cwd()
          : global.process.cwd();

      const basePath = searchUpward(root, relative);

      if (!basePath) {
        throw new Error(`Could not find bucket: ${prefix}`);
      }

      return new LocalStorage(basePath, fs);
    }

    case "s3": {
      const config = {
        forcePathStyle: true,
        region: process.env.S3_REGION,
      };

      // Configure credentials
      if (process.env.S3_BUCKET_ROLE_ARN) {
        config.credentials = fromTemporaryCredentials({
          params: {
            RoleArn: process.env.S3_BUCKET_ROLE_ARN,
            RoleSessionName: `copilot-ld-${generateUUID()}`,
            DurationSeconds: 3600, // 1 hour
          },
        });
      } else if (
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
      ) {
        config.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      }
      // If no explicit credentials are provided, use default credential chain

      // Optional custom endpoint for S3-compatible services
      if (process.env.MINIO_ENDPOINT)
        config.endpoint = process.env.MINIO_ENDPOINT;

      const client = new S3Client(config);

      // Get bucket name from environment, use the factory parameter as prefix
      const bucketName = process.env.S3_BUCKET_NAME || "copilot-ld";
      return new S3Storage(prefix, bucketName, client, {
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
