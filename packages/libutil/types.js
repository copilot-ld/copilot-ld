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
 * Base interface for processor implementations
 * Defines the contract for configurable processing utilities
 */
export class ProcessorInterface {
  /**
   * Process input with given configuration
   * @param {any} input - Input to process
   * @param {object} config - Processing configuration
   * @returns {Promise<any>} Processing result
   */
  async process(input, config) {
    throw new Error("ProcessorInterface.process() not implemented");
  }
}

/**
 * Base interface for upload implementations
 * Defines the contract for storage synchronization utilities
 */
export class UploadInterface {
  /**
   * Initialize storage instances for all storage areas
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error("UploadInterface.initialize() not implemented");
  }

  /**
   * Upload all items from local storage to remote storage
   * @returns {Promise<void>}
   */
  async upload() {
    throw new Error("UploadInterface.upload() not implemented");
  }
}

/**
 * Base interface for download implementations
 * Defines the contract for downloading and extracting bundle.tar.gz from remote storage
 */
export class DownloadInterface {
  /**
   * Initialize storage instances for download operations
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error("DownloadInterface.initialize() not implemented");
  }

  /**
   * Download bundle.tar.gz from remote storage and extract to local storage
   * @returns {Promise<void>}
   */
  async download() {
    throw new Error("DownloadInterface.download() not implemented");
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
   * Generate service definition artifacts (pre-compiled to eliminate proto-loader)
   * @param {string} generatedPath - Absolute path to librpc package generated directory
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async runDefinitions(generatedPath) {
    throw new Error("CodegenInterface.runDefinitions() not implemented");
  }

  /**
   * Generate definitions exports file
   * @param {string} generatedPath - Absolute path to librpc package generated directory
   * @returns {Promise<void>}
   * @throws {Error} Not implemented
   */
  async runDefinitionsExports(generatedPath) {
    throw new Error("CodegenInterface.runDefinitionsExports() not implemented");
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
