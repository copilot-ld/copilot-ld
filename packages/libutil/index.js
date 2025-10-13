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
 * Finds the most recent user message in a conversation
 * @param {import("@copilot-ld/libtype").common.Message[]} messages - Array of conversation messages
 * @returns {import("@copilot-ld/libtype").common.Message|null} Latest user message or null if none found
 */
export function getLatestUserMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i];
    }
  }
  return null;
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
   * @param {string} itemUri - The URI to check
   * @param {string} prefix - The prefix to match
   * @returns {boolean} True if item should be included
   * @protected
   */
  _applyPrefixFilter(itemUri, prefix) {
    if (!prefix) return true;
    return itemUri.startsWith(prefix);
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
    const parsedItems = Array.isArray(items) ? items : [];

    // Populate the index map with URI as key
    this.#index.clear();
    for (const item of parsedItems) {
      this.#index.set(item.uri, item);
    }

    this.#loaded = true;
  }

  /**
   * Adds an item to the index - must be implemented by subclasses
   * @param {...any} _args - Arguments specific to the index type
   * @returns {Promise<void>}
   * @abstract
   */
  async addItem(..._args) {
    throw new Error("addItem() must be implemented by subclasses");
  }

  /**
   * Queries items from the index - must be implemented by subclasses
   * @param {...any} _args - Arguments specific to the index type
   * @returns {Promise<import("@copilot-ld/libtype").resource.Identifier[]>} Array of resource identifiers
   * @abstract
   */
  async queryItems(..._args) {
    throw new Error("queryItems() must be implemented by subclasses");
  }
}

export { Logger } from "./logger.js";
export { Finder } from "./finder.js";
export { Uploader } from "./uploader.js";
export { Downloader } from "./downloader.js";
export { TarExtractor } from "./extractor.js";
export { ProcessorBase } from "./processor.js";
