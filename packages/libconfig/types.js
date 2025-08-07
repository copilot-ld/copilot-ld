/* eslint-env node */

/** @typedef {typeof import("process")} Process */
/** @typedef {typeof import("dotenv").config} DotenvConfig */

/**
 * Base interface for configuration management
 */
export class ConfigInterface {
  /**
   * Creates a new Config instance that spreads config parameters into the instance
   * @param {string} namespace - Namespace for the configuration (e.g., "server", "extension")
   * @param {string} name - Name of the configuration (used for environment variable prefix)
   * @param {object} _defaults - Default configuration values
   * @param {object} _fs - File system operations
   * @param {object} _process - Process environment access
   * @param {Function} _dotenv - Dotenv config function
   * @throws {Error} Not implemented
   */
  constructor(
    namespace,
    name,
    _defaults = {},
    _fs = null,
    _process = null,
    _dotenv = null,
  ) {}

  /**
   * Gets path within the data directory, creating if missing
   * @param {string} path - Relative path within data directory
   * @throws {Error} Not implemented
   */
  dataPath(path = "") {
    throw new Error("ConfigInterface.dataPath() not implemented");
  }

  /**
   * Gets the GitHub client ID from environment variable
   * @throws {Error} Not implemented
   */
  githubClientId() {
    throw new Error("ConfigInterface.githubClientId() not implemented");
  }

  /**
   * Gets the GitHub token from environment variable or .ghtoken file
   * @throws {Error} Not implemented
   */
  githubToken() {
    throw new Error("ConfigInterface.githubToken() not implemented");
  }

  /**
   * Gets path within the public directory
   * @param {string} path - Relative path within public directory
   * @throws {Error} Not implemented
   */
  publicPath(path = "") {
    throw new Error("ConfigInterface.publicPath() not implemented");
  }

  /**
   * Gets path to a specific proto file
   * @param {string} name - Proto file name without extension
   * @throws {Error} Not implemented
   */
  protoFile(name) {
    throw new Error("ConfigInterface.protoFile() not implemented");
  }

  /**
   * Resets cached values (useful for testing)
   * @throws {Error} Not implemented
   */
  reset() {
    throw new Error("ConfigInterface.reset() not implemented");
  }
}

/**
 * Base interface for extension configuration
 */
export class ExtensionConfigInterface extends ConfigInterface {
  /**
   * Creates an extension configuration instance
   * @param {string} name - Extension name for environment variable prefix
   * @param {object} defaults - Default configuration values
   * @throws {Error} Not implemented
   */
  constructor(name, defaults = {}) {
    super("extension", name, defaults);
  }
}

/**
 * Base interface for service configuration
 */
export class ServiceConfigInterface extends ConfigInterface {
  /**
   * Creates a service configuration instance
   * @param {string} name - Service name for environment variable prefix
   * @param {object} defaults - Default configuration values
   * @throws {Error} Not implemented
   */
  constructor(name, defaults = {}) {
    super("service", name, defaults);
  }
}

/**
 * Base interface for tool configuration
 */
export class ToolConfigInterface extends ConfigInterface {
  /**
   * Creates a tool configuration instance
   * @param {string} name - Tool name for environment variable prefix
   * @param {object} defaults - Default configuration values
   * @throws {Error} Not implemented
   */
  constructor(name, defaults = {}) {
    super("tool", name, defaults);
  }
}
