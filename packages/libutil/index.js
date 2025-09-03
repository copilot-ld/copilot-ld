/* eslint-env node */
import crypto from "crypto";
import { LoggerInterface } from "./types.js";

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
 * Logger class for centralized logging with namespace support
 */
export class Logger extends LoggerInterface {
  /**
   * Creates a new Logger instance
   * @param {string} namespace - Namespace for this logger instance
   */
  constructor(namespace) {
    super(namespace);

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
 * Generates a unique session ID for conversation tracking
 * @returns {string} Unique session identifier
 */
export function generateSessionId() {
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
