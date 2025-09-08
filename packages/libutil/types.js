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

/**
 * Base interface for batch processor implementations
 */
export class ProcessorInterface {
  /**
   * Creates a new processor instance
   * @param {object} logger - Logger instance for debug output
   * @param {number} batchSize - Size of batches for processing (default: 10)
   * @throws {Error} Not implemented
   */
  constructor(logger, batchSize = 10) {
    // Interface constructor - does not implement logic
  }

  /**
   * Processes items from a collection in batches
   * @param {Array} items - Array of items to process
   * @param {string} [context] - Context string for logging
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async process(items, context = "items") {
    throw new Error("ProcessorInterface.process() not implemented");
  }

  /**
   * Processes a single batch of items
   * @param {Array} batch - Array of items in the current batch
   * @param {number} processed - Number of items already processed
   * @param {number} total - Total number of items to process
   * @param {string} context - Context string for logging
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async processBatch(batch, processed, total, context) {
    throw new Error("ProcessorInterface.processBatch() not implemented");
  }

  /**
   * Processes a single item within a batch
   * @param {*} item - The item to process
   * @returns {Promise<*>} Processing result
   * @throws {Error} Not implemented
   */
  async processItem(item) {
    throw new Error("ProcessorInterface.processItem() not implemented");
  }
}
