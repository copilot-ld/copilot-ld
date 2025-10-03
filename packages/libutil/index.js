/* eslint-env node */
import crypto from "crypto";
import { execSync } from "node:child_process";
import fs from "fs/promises";

import { Tokenizer, ranks } from "./tokenizer.js";
import { Logger } from "./logger.js";
import { Finder } from "./finder.js";
import { Download } from "./download.js";

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

/**
 * Factory function to create a Logger instance
 * @param {string} namespace - Namespace for the logger
 * @returns {Logger} New Logger instance
 */
export function logFactory(namespace) {
  return new Logger(namespace);
}

/**
 * Creates a Download instance configured for generated code management
 * This is the new API that services should use instead of ensureGeneratedCode
 * @param {Function} storageFactory - Storage factory function from libstorage
 * @param {object} process - Process environment access (for testing)
 * @returns {Download} Configured Download instance
 */
export function downloadFactory(storageFactory, process = global.process) {
  if (!storageFactory) throw new Error("storageFactory is required");

  const logger = new Logger("generated");
  const finder = new Finder(fs, logger, process);

  return new Download(storageFactory, execSync, logger, finder, process);
}

export { Logger } from "./logger.js";
export { Finder } from "./finder.js";
export { Upload } from "./upload.js";
export { Download } from "./download.js";
export { ProcessorBase } from "./processor.js";
