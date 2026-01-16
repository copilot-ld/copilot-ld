import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  fromJsonLines,
  fromJson,
  toJsonLines,
  toJson,
  isJsonLines,
  isJson,
} from "./index.js";

/**
 * @typedef {import('./index.js').StorageInterface} StorageInterface
 */

/**
 * S3-compatible storage implementation
 * @implements {StorageInterface}
 */
export class S3Storage {
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
  constructor(
    prefix,
    bucket,
    client,
    commands = {
      CreateBucketCommand,
      DeleteObjectCommand,
      GetObjectCommand,
      HeadBucketCommand,
      HeadObjectCommand,
      ListObjectsV2Command,
      PutObjectCommand,
    },
  ) {
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

    await this.#executeCommand(this.#commands.PutObjectCommand, key, {
      Body: bodyData,
    });
  }

  /**
   * Retrieve data by key
   * @param {string} key - Storage key identifier
   * @returns {Promise<any>} Retrieved data
   */
  async get(key) {
    const response = await this.#executeCommand(
      this.#commands.GetObjectCommand,
      key,
    );

    const content = await this.#readResponseBody(response);

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
    await this.#executeCommand(this.#commands.DeleteObjectCommand, key);
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key identifier
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    return await this.#withNotFoundHandling(async () => {
      await this.#executeCommand(this.#commands.HeadObjectCommand, key);
      return true;
    }, false);
  }

  // Advanced Operations

  /**
   * Append data to an existing key with automatic newline
   * @param {string} key - Storage key identifier
   * @param {string|Buffer} data - Data to append
   * @returns {Promise<void>}
   */
  async append(key, data) {
    const existingData = await this.#withNotFoundHandling(
      () => this.#getRaw(key),
      Buffer.alloc(0),
    );

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
        const data = await this.#withNotFoundHandling(
          () => this.get(key),
          null,
        );
        if (data !== null) {
          results[key] = data;
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
   * Find keys with specified prefix, optionally grouped by delimiter
   * @param {string} prefix - Key prefix to match
   * @param {string} [delimiter] - Optional delimiter to group keys (e.g. '/')
   * @returns {Promise<string[]>} Array of matching keys or prefixes
   */
  async findByPrefix(prefix, delimiter = undefined) {
    const keys = await this.#traverse({
      Prefix: `${this.#prefix}/${prefix}`,
      Delimiter: delimiter,
    });
    return keys;
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
  path(key = ".") {
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
      await this.#executeCommand(this.#commands.HeadBucketCommand, {
        Bucket: this.#bucket,
      });
      return false; // Bucket already exists
    } catch (error) {
      if (this.#isNotFound(error)) {
        await this.#executeCommand(this.#commands.CreateBucketCommand, {
          Bucket: this.#bucket,
        });
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
    return await this.#withNotFoundHandling(async () => {
      await this.#executeCommand(this.#commands.HeadBucketCommand, {
        Bucket: this.#bucket,
      });
      return true;
    }, false);
  }

  // Private Helper Methods

  /**
   * Executes an S3 command with the client
   * @param {Function} CommandClass - S3 command constructor
   * @param {string|object} keyOrParams - Storage key identifier or complete command parameters
   * @param {object} [additionalParams] - Additional parameters when keyOrParams is a key
   * @returns {Promise<any>} Command response
   * @private
   */
  async #executeCommand(CommandClass, keyOrParams, additionalParams = {}) {
    let params;

    if (typeof keyOrParams === "string") {
      // keyOrParams is a key, build command parameters
      params = {
        Bucket: this.#bucket,
        Key: this.path(keyOrParams),
        ...additionalParams,
      };
    } else {
      // keyOrParams is already complete parameters
      params = keyOrParams;
    }

    const command = new CommandClass(params);
    return await this.#client.send(command);
  }

  /**
   * Reads response body stream into a buffer
   * @param {object} response - S3 response object
   * @returns {Promise<Buffer>} Concatenated buffer
   * @private
   */
  async #readResponseBody(response) {
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Executes an operation with not found error handling
   * @param {Function} operation - Async operation to execute
   * @param {any} defaultValue - Value to return if not found
   * @returns {Promise<any>} Operation result or default value
   * @private
   */
  async #withNotFoundHandling(operation, defaultValue) {
    try {
      return await operation();
    } catch (error) {
      if (this.#isNotFound(error)) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Checks if error represents a not found condition (object or bucket)
   * @private
   */
  #isNotFound(error) {
    return (
      error.name === "NotFound" ||
      error.$metadata?.httpStatusCode === 404 ||
      error.Code === "NoSuchBucket" ||
      error.name === "NoSuchKey"
    );
  }

  /**
   * Get raw data without JSON Lines parsing
   * @param {string} key - Storage key identifier
   * @returns {Promise<Buffer>} Raw buffer data
   * @private
   */
  async #getRaw(key) {
    const response = await this.#executeCommand(
      this.#commands.GetObjectCommand,
      key,
    );
    return await this.#readResponseBody(response);
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
      const response = await this.#executeCommand(
        this.#commands.ListObjectsV2Command,
        {
          Bucket: this.#bucket,
          ContinuationToken: continuationToken,
          ...listOptions,
        },
      );

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
