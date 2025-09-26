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

/**
 * Base interface for code generation implementations
 */
export class CodegenInterface {
  /**
   * Creates a new codegen instance
   * @param {object} projectRoot - Project root directory path
   * @param {object} path - Path module for file operations
   * @param {object} mustache - Mustache template rendering module
   * @param {object} protoLoader - Protocol buffer loader module
   * @param {object} fs - File system module (sync operations only)
   * @throws {Error} Not implemented
   */
  constructor(projectRoot, path, mustache, protoLoader, fs) {
    // Interface constructor - does not implement logic
  }

  // High-level operations (main entry points)

  /**
   * Generate libtype/types.js and types.d.ts from project protobufs
   * @param {string} generatedPath - Absolute path to libtype package generated directory
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async runTypes(generatedPath) {
    throw new Error("CodegenInterface.runTypes() not implemented");
  }

  /**
   * Generate service or client artifacts
   * @param {"service"|"client"} kind - Artifact kind to generate
   * @param {string} generatedPath - Absolute path to librpc package generated directory
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async runForKind(kind, generatedPath) {
    throw new Error("CodegenInterface.runForKind() not implemented");
  }

  /**
   * Generate dynamic service exports file
   * @param {string} generatedPath - Absolute path to librpc package generated directory
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async runServicesExports(generatedPath) {
    throw new Error("CodegenInterface.runServicesExports() not implemented");
  }

  // Mid-level operations (core generation functions)

  /**
   * Generate JavaScript types using protobufjs pbjs
   * @param {string[]} protoFiles - Array of absolute .proto file paths
   * @param {string} outFile - Absolute output path for generated JS module
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async generateJavaScriptTypes(protoFiles, outFile) {
    throw new Error(
      "CodegenInterface.generateJavaScriptTypes() not implemented",
    );
  }

  // Low-level utilities (helper functions)

  /**
   * Collect protobuf file paths for generation
   * @param {object} [opts] - Collection options
   * @param {boolean} [opts.includeTools] - Whether to include tool proto files
   * @throws {Error} Not implemented
   */
  collectProtoFiles(opts = {}) {
    throw new Error("CodegenInterface.collectProtoFiles() not implemented");
  }
}
