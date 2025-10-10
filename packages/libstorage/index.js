/* eslint-env node */
import { promises as fs } from "fs";
import fsAsync from "fs/promises";
import { join } from "path";

import { S3Client } from "@aws-sdk/client-s3";
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";

import { generateUUID, Finder, Logger } from "@copilot-ld/libutil";

import { LocalStorage } from "./local.js";
import { S3Storage } from "./s3.js";

/**
 * @typedef {object} StorageInterface
 * @property {function(string, string|Buffer|object): Promise<void>} put - Store data with the given key
 * @property {function(string): Promise<any>} get - Retrieve data by key
 * @property {function(string): Promise<void>} delete - Remove data by key
 * @property {function(string): Promise<boolean>} exists - Check if key exists
 * @property {function(string, string|Buffer): Promise<void>} append - Append data to an existing key
 * @property {function(string[]): Promise<object>} getMany - Retrieve multiple items by their keys
 * @property {function(): Promise<string[]>} list - Lists all keys in storage
 * @property {function(string): Promise<string[]>} findByPrefix - Find keys with specified prefix
 * @property {function(string): Promise<string[]>} findByExtension - Find keys with specified extension
 * @property {function(string=): string} path - Gets the full path for a storage key
 */

/**
 * Parse JSON Lines (JSONL) format into an array of objects
 * @param {Buffer|string} content - Content to parse as JSON Lines
 * @returns {object[]} Array of parsed JSON objects
 */
export function fromJsonLines(content) {
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
export function fromJson(content) {
  const text = content.toString().trim();
  if (!text) return {};

  return JSON.parse(text);
}

/**
 * Convert array of objects to JSON Lines (JSONL) format
 * @param {object[]} data - Array of objects to convert to JSONL
 * @returns {string} JSONL formatted string
 */
export function toJsonLines(data) {
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
export function toJson(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Check if key represents a JSON Lines file and data is an array
 * @param {string} key - Storage key identifier
 * @param {*} data - Data to check
 * @returns {boolean} True if this should be serialized as JSONL
 */
export function isJsonLines(key, data) {
  return key.endsWith(".jsonl") && Array.isArray(data);
}

/**
 * Check if key represents a JSON file and data is an object
 * @param {string} key - Storage key identifier
 * @param {*} data - Data to check
 * @returns {boolean} True if this should be serialized as JSON
 */
export function isJson(key, data) {
  return (
    key.endsWith(".json") &&
    typeof data === "object" &&
    data !== null &&
    !Buffer.isBuffer(data)
  );
}

/**
 * Creates a local storage instance
 * @param {string} prefix - Bucket/directory name for local storage
 * @param {object} process - Process environment access (for testing)
 * @returns {LocalStorage} Local storage instance
 * @throws {Error} When bucket directory cannot be found
 */
function _createLocalStorage(prefix, process) {
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
    typeof process.cwd === "function" ? process.cwd() : global.process.cwd();

  // Create Finder instance with required dependencies
  const logger = new Logger("storage");
  const finder = new Finder(fsAsync, logger, process);
  const basePath = finder.findUpward(root, relative);

  if (!basePath) {
    throw new Error(`Could not find bucket: ${prefix}`);
  }

  return new LocalStorage(basePath, fs);
}

/**
 * Creates an S3 storage instance
 * @param {string} prefix - Prefix for S3 storage operations
 * @param {object} process - Process environment access (for testing)
 * @returns {S3Storage} S3 storage instance
 */
function _createS3Storage(prefix, process) {
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
  if (process.env.MINIO_ENDPOINT) config.endpoint = process.env.MINIO_ENDPOINT;

  const client = new S3Client(config);

  // Get bucket name from environment, use the factory parameter as prefix
  const bucketName = process.env.S3_BUCKET_NAME || "copilot-ld";
  return new S3Storage(prefix, bucketName, client);
}

/**
 * Creates a storage instance based on environment variables
 * @param {string} prefix - Prefix for the storage operations (for S3) or bucket/directory name (for local)
 * @param {string} type - Storage type ("local" or "s3")
 * @param {object} process - Process environment access (for testing)
 * @returns {object} Storage instance
 * @throws {Error} When unsupported storage type is provided
 */
export function createStorage(prefix, type, process = global.process) {
  const finalType = type || process.env.STORAGE_TYPE || "local";

  switch (finalType) {
    case "local":
    case undefined:
      return _createLocalStorage(prefix, process);

    case "s3":
      return _createS3Storage(prefix, process);

    default:
      throw new Error(`Unsupported storage type: ${type}`);
  }
}

// Re-export storage classes
export { LocalStorage } from "./local.js";
export { S3Storage } from "./s3.js";
