/* eslint-env node */

/**
 * Base interface for logger implementations
 */
export class LoggerInterface {
  /**
   * Logs a debug message if logging is enabled for this namespace
   * @param {string} message - The log message
   * @param {object} [data] - Optional key-value pairs to append to the message
   * @throws {Error} Not implemented
   */
  debug(message, data) {
    throw new Error("LoggerInterface.debug() not implemented");
  }
}
