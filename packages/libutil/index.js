/* eslint-env node */
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

import { Tokenizer, ranks } from "./tokenizer.js";
import { Logger } from "./logger.js";
import { Finder } from "./finder.js";
import { Downloader } from "./downloader.js";
import { TarExtractor } from "./extractor.js";

/**
 * Updates or creates an environment variable in .env file
 * @param {string} key - Environment variable name (e.g., "SERVICE_SECRET")
 * @param {string} value - Environment variable value
 * @param {string} [envPath] - Path to .env file (defaults to .env in current directory)
 */
export async function updateEnvFile(key, value, envPath = ".env") {
  const fullPath = path.resolve(envPath);
  let content = "";

  try {
    content = await fs.readFile(fullPath, "utf8");
  } catch (error) {
    // It's ok if the file doesn't exist
    if (error.code !== "ENOENT") throw error;
  }

  const envLine = `${key}=${value}`;
  const lines = content.split("\n");
  let found = false;

  // Look for existing key line (both active and commented)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`) || lines[i].startsWith(`# ${key}=`)) {
      lines[i] = envLine;
      found = true;
      break;
    }
  }

  // If not found, add it to the end
  if (!found) {
    if (content && !content.endsWith("\n")) {
      lines.push("");
    }
    lines.push(envLine);
  }

  // Write back to file
  await fs.writeFile(fullPath, lines.join("\n"));
}

/**
 * Generates a deterministic hash from multiple input values
 * @param {...string} values - Values to hash together
 * @returns {string} The first 16 characters of SHA256 hash
 */
export function generateHash(...values) {
  const input = values.filter(Boolean).join(".");
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("hex")
    .substring(0, 8);
}

/**
 * Generates a unique session ID for conversation tracking
 * @returns {string} Unique session identifier
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Helper function to count tokens
 * @param {string} text - Text to count tokens for
 * @param {Tokenizer} tokenizer - Tokenizer instance
 * @returns {number} Approximate token count
 */
export function countTokens(text, tokenizer) {
  if (!tokenizer) tokenizer = createTokenizer();
  return tokenizer.encode(text).length;
}

/**
 * Creates a new tokenizer instance
 * @returns {Tokenizer} New tokenizer instance
 */
export function createTokenizer() {
  return new Tokenizer(ranks);
}

/**
 * Factory function to create a Logger instance
 * @param {string} namespace - Namespace for the logger
 * @returns {Logger} New Logger instance
 */
export function createLogger(namespace) {
  return new Logger(namespace);
}

/**
 * Creates a Download instance configured for generated code management
 * This is the new API that services should use instead of ensureGeneratedCode
 * @param {Function} createStorage - Storage factory function from libstorage
 * @returns {Downloader} Configured Downloader instance
 */
export function createDownloader(createStorage) {
  if (!createStorage) throw new Error("createStorage is required");

  const logger = new Logger("generated");
  const finder = new Finder(fs, logger);
  const extractor = new TarExtractor(fs, path);

  return new Downloader(createStorage, finder, logger, extractor);
}

/**
 * Executes command line arguments as child process, similar to execv() in C
 * @param {number} [shift] - Number of arguments to skip from process.argv before extracting command
 * @returns {void} Function does not return - exits parent process
 */
export function execLine(shift = 0) {
  const args = process.argv.slice(2 + shift);
  if (args.length === 0) return;

  // Look for '--' delimiter and use everything after it as the command
  const index = args.indexOf("--");
  const line = index !== -1 ? args.slice(index + 1) : args;

  if (line.length === 0) return;

  const [command, ...commandArgs] = line;
  const child = spawn(command, commandArgs, {
    stdio: "inherit",
    env: process.env,
  });

  // Forward signals to child process
  ["SIGTERM", "SIGINT", "SIGQUIT"].forEach((signal) => {
    process.on(signal, () => child.kill(signal));
  });

  child.on("error", (error) => {
    console.error("Error:", error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    process.exit(signal ? 1 : code || 0);
  });
}

/**
 * Base class for index implementations providing shared filtering logic
 */
export class IndexBase {
  #storage;
  #indexKey;
  #index = new Map();
  #loaded = false;

  /**
   * Creates a new IndexBase instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage interface for data operations
   * @param {string} [indexKey] - The index file name to use for storage (default: "index.jsonl")
   */
  constructor(storage, indexKey = "index.jsonl") {
    if (!storage) throw new Error("storage is required");

    this.#storage = storage;
    this.#indexKey = indexKey;
  }

  /**
   * Gets the storage instance
   * @returns {import("@copilot-ld/libstorage").StorageInterface} Storage instance
   */
  storage() {
    return this.#storage;
  }

  /**
   * Gets the index key (filename)
   * @returns {string} The index key
   */
  get indexKey() {
    return this.#indexKey;
  }

  /**
   * Gets the internal index map
   * @returns {Map} The index map
   * @protected
   */
  get index() {
    return this.#index;
  }

  /**
   * Gets the loaded state
   * @returns {boolean} True if index is loaded
   * @protected
   */
  get loaded() {
    return this.#loaded;
  }

  /**
   * Sets the loaded state
   * @param {boolean} value - Loaded state to set
   * @protected
   */
  set loaded(value) {
    this.#loaded = value;
  }

  /**
   * Applies prefix filter to items during query iteration
   * @param {string} id - The id to check
   * @param {string} prefix - The prefix to match
   * @returns {boolean} True if item should be included
   * @protected
   */
  _applyPrefixFilter(id, prefix) {
    if (!prefix) return true;
    return id.startsWith(prefix);
  }

  /**
   * Applies limit filter to results
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} results - Array of results to filter
   * @param {number} limit - Maximum number of results
   * @returns {import("@copilot-ld/libtype").resource.Identifier[]} Filtered results
   * @protected
   */
  _applyLimitFilter(results, limit) {
    if (!limit || limit <= 0) return results;
    return results.slice(0, limit);
  }

  /**
   * Applies max_tokens filter to results
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} results - Array of results to filter
   * @param {number} max_tokens - Maximum total tokens allowed
   * @returns {import("@copilot-ld/libtype").resource.Identifier[]} Filtered results
   * @protected
   */
  _applyTokensFilter(results, max_tokens) {
    if (!max_tokens || max_tokens <= 0) return results;

    const filtered = [];
    let total = 0;

    for (const identifier of results) {
      if (total + identifier.tokens > max_tokens) break;

      total += identifier.tokens;
      filtered.push(identifier);
    }

    return filtered;
  }

  /**
   * Gets an item by its resource ID
   * @param {string} id - The resource ID to retrieve
   * @returns {Promise<import("@copilot-ld/libtype").resource.Identifier|null>} The item identifier, or null if not found
   */
  async getItem(id) {
    if (!this.#loaded) await this.loadData();
    const item = this.#index.get(id);
    return item ? item.identifier : null;
  }

  /**
   * Checks if an item with the given ID exists in the index
   * @param {string} id - The ID to check for
   * @returns {Promise<boolean>} True if item exists, false otherwise
   */
  async hasItem(id) {
    if (!this.#loaded) await this.loadData();
    return this.#index.has(id);
  }

  /**
   * Loads data from storage with common logic for all index types
   * Subclasses can override this method to add type-specific processing
   * @returns {Promise<void>}
   */
  async loadData() {
    // Check if already loaded to make this method idempotent
    if (this.#loaded) return;

    if (!(await this.#storage.exists(this.#indexKey))) {
      // Initialize empty index for new systems
      this.#index.clear();
      this.#loaded = true;
      return;
    }

    // Storage automatically parses .jsonl files into arrays
    const items = await this.#storage.get(this.#indexKey);

    // Populate the memory index
    this.#index.clear();
    for (const item of items) {
      this.#index.set(item.id, item);
    }

    this.#loaded = true;
  }

  /**
   * Adds an item to the index with generic storage operations
   * Subclasses should override this to create their specific item structure,
   * then call super.addItem(item) to handle storage
   * @param {object} item - The item object with required and optional properties
   * @param {string} item.id - Unique string identifier for the item (used as Map key)
   * @param {import("@copilot-ld/libtype").resource.Identifier} item.identifier - Resource identifier object
   * @returns {Promise<void>}
   */
  async addItem(item) {
    if (!this.#loaded) await this.loadData();

    // Store item in memory
    this.#index.set(item.id, item);

    // Append item to storage on disk
    await this.#storage.append(this.#indexKey, JSON.stringify(item));
  }

  /**
   * Queries items from the index using basic filtering
   * Provides a default implementation that applies shared filters to all items
   * Subclasses can override this for more sophisticated query logic
   * @param {import("@copilot-ld/libtype").tool.QueryFilter} filter - Filter object for query constraints
   * @returns {Promise<import("@copilot-ld/libtype").resource.Identifier[]>} Array of resource identifiers
   */
  async queryItems(filter = {}) {
    if (!this.#loaded) await this.loadData();

    const { prefix, limit, max_tokens } = filter;
    const identifiers = [];

    // Loop through all index values and collect identifiers
    for (const item of this.#index.values()) {
      if (!this._applyPrefixFilter(item.id, prefix)) continue;

      // Add the identifier to results
      const identifier = item.identifier;
      if (identifier) {
        identifiers.push(identifier);
      }
    }

    // Apply shared filters
    let results = this._applyLimitFilter(identifiers, limit);
    results = this._applyTokensFilter(results, max_tokens);

    return results;
  }
}

export { Logger } from "./logger.js";
export { Finder } from "./finder.js";
export { Uploader } from "./uploader.js";
export { Downloader } from "./downloader.js";
export { TarExtractor } from "./extractor.js";
export { ProcessorBase } from "./processor.js";
export { Retry, createRetry } from "./retry.js";
