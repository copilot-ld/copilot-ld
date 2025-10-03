/* eslint-env node */

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
