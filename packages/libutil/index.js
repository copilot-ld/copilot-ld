/* eslint-env node */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

import { Tokenizer, ranks } from "./tokenizer.js";

/**
 * Searches upward from one or more roots for a target file or directory.
 * Uses synchronous existence checks for simplicity.
 * @param {string} root - Starting directory to search from
 * @param {string} relativePath - Relative path to append while traversing upward
 * @param {number} maxDepth - Maximum parent levels to check
 * @returns {string|null} Found absolute path or null
 */
export function searchUpward(root, relativePath, maxDepth = 3) {
  let current = root;
  for (let depth = 0; depth < maxDepth; depth++) {
    const candidate = path.join(current, relativePath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/**
 * Find the project root directory
 * @param {string} startPath - Starting directory path
 * @returns {string} Project root directory path
 */
export function resolveProjectRoot(startPath) {
  const projectRoot = searchUpward(startPath, "../../../package.json", 5);
  if (projectRoot) {
    return path.dirname(projectRoot);
  }

  throw new Error("Could not find project root");
}

/**
 * Resolve the actual filesystem path to a package
 * Works both in monorepo (./packages) and when installed as dependency
 * @param {string} projectRoot - Project root directory path
 * @param {"libtype"|"librpc"} packageName - Package name without scope
 * @returns {string} Absolute path to package directory
 */
export function resolvePackagePath(projectRoot, packageName) {
  const fullPackageName = `@copilot-ld/${packageName}`;

  // First try local monorepo structure
  const localPath = path.join(projectRoot, "packages", packageName);
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // Fall back to Node module resolution for installed packages
  const require = createRequire(path.join(projectRoot, "package.json"));

  // Resolve the package.json path
  const packageJsonPath = require.resolve(`${fullPackageName}/package.json`);
  return path.dirname(packageJsonPath);
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
 * Logger class for centralized logging with namespace support
 */
export class Logger {
  /**
   * Creates a new Logger instance
   * @param {string} namespace - Namespace for this logger instance
   */
  constructor(namespace) {
    if (!namespace || typeof namespace !== "string") {
      throw new Error("namespace must be a non-empty string");
    }
    this.namespace = namespace;
    this.enabled = this.#isEnabled();
  }

  /**
   * Checks if logging is enabled for this namespace based on DEBUG environment variable
   * @returns {boolean} Whether logging is enabled
   * @private
   */
  #isEnabled() {
    const debugEnv = process.env.DEBUG || "";

    if (debugEnv === "*") {
      return true;
    }

    if (debugEnv === "") {
      return false;
    }

    const patterns = debugEnv.split(",").map((p) => p.trim());

    return patterns.some((pattern) => {
      if (pattern === this.namespace) {
        return true;
      }

      if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1);
        return this.namespace.startsWith(prefix);
      }

      return false;
    });
  }

  /**
   * Logs a debug message if logging is enabled for this namespace
   * @param {string} message - The log message
   * @param {object} [data] - Optional key-value pairs to append to the message
   */
  debug(message, data) {
    if (!this.enabled) {
      return;
    }

    let fullMessage = message;

    if (data && typeof data === "object") {
      const pairs = Object.entries(data)
        .map(([key, value]) => `${key}=${value}`)
        .join(" ");

      if (pairs) {
        fullMessage = fullMessage + " " + pairs;
      }
    }

    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${this.namespace}: ${fullMessage}`;

    console.error(logLine);
  }
}

/**
 * Factory function to create a Logger instance
 * @param {string} namespace - Namespace for the logger
 * @returns {Logger} New Logger instance
 */
export function logFactory(namespace) {
  return new Logger(namespace);
}

/**
 * Base class for batch processor implementations with common batch management logic
 */
export class ProcessorBase {
  #logger;
  #batchSize;

  /**
   * Creates a new processor instance
   * @param {object} logger - Logger instance for debug output
   * @param {number} batchSize - Size of batches for processing (default: 10)
   */
  constructor(logger, batchSize = 20) {
    if (!logger) throw new Error("logger is required");
    if (typeof batchSize !== "number" || batchSize < 1) {
      throw new Error("batchSize must be a positive number");
    }

    this.#logger = logger;
    this.#batchSize = batchSize;
  }

  /**
   * Processes items in batches
   * @param {any[]} items - Items to process
   * @param {string} context - Processing context label
   * @returns {Promise<any[]>} Processed results
   */
  async process(items, context = "items") {
    if (!Array.isArray(items)) {
      throw new Error("items must be an array");
    }

    if (items.length === 0) {
      this.#logger.debug("No items to process", { context });
      return;
    }

    this.#logger.debug("Starting batch processing", {
      total: items.length,
      context,
    });

    let currentBatch = [];
    let processedCount = 0;

    for (let i = 0; i < items.length; i++) {
      currentBatch.push(items[i]);

      // Process batch when it reaches the configured size
      if (currentBatch.length >= this.#batchSize) {
        await this.processBatch(
          currentBatch,
          processedCount,
          items.length,
          context,
        );
        processedCount += currentBatch.length;
        currentBatch = [];
      }
    }

    // Process any remaining items in the final batch
    if (currentBatch.length > 0) {
      await this.processBatch(
        currentBatch,
        processedCount,
        items.length,
        context,
      );
    }
  }

  /**
   * Processes a batch of items
   * @param {any[]} batch - Batch to process
   * @param {number} processed - Number already processed
   * @param {number} total - Total number of items
   * @param {object} context - Processing context
   * @returns {Promise<any[]>} Batch results
   */
  async processBatch(batch, processed, total, context) {
    const batchSize = batch.length;

    this.#logger.debug("Processing batch", {
      items:
        batchSize > 1
          ? `${processed + 1}-${processed + batchSize}/${total}`
          : `${processed + 1}/${total}`,
      context,
    });

    // Process all items in the batch in parallel
    const promises = batch.map(async (item, itemIndex) => {
      const globalIndex = processed + itemIndex;
      try {
        return await this.processItem(item);
      } catch (error) {
        this.#logger.debug("Skipping, failed to process item", {
          item: `${globalIndex + 1}/${total}`,
          context,
          error: error.message,
        });
        return null;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Processes a single item (must be implemented by subclass)
   * @param {any} _item - Item to process
   * @returns {Promise<any>} Processed result
   */
  async processItem(_item) {
    throw new Error("processItem must be implemented by subclass");
  }
}

/**
 * Finds the most recent user message in a conversation
 * @param {object[]} messages - Array of conversation messages
 * @returns {object|null} Latest user message or null if none found
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
  if (!tokenizer) tokenizer = tokenizerFactory();
  return tokenizer.encode(text).length;
}

/**
 * Creates a new tokenizer instance
 * @returns {Tokenizer} New tokenizer instance
 */
export function tokenizerFactory() {
  return new Tokenizer(ranks);
}

export { Codegen } from "./codegen.js";
export { Upload } from "./upload.js";
export { Download } from "./download.js";
