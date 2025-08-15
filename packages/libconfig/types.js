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
   * @param {(options?: object) => object} _dotenv - Dotenv config function
   * @param {(bucket: string, type?: string, process?: object) => object} _storageFn - Optional storage factory function
   * @throws {Error} Not implemented
   */
  constructor(
    namespace,
    name,
    _defaults = {},
    _fs = null,
    _process = null,
    _dotenv = null,
    _storageFn = null,
  ) {
    this.namespace = namespace;
    this.name = name;
    this.defaults = _defaults;
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
   * @returns {Promise<string>} GitHub token
   * @throws {Error} Not implemented
   */
  async githubToken() {
    throw new Error("ConfigInterface.githubToken() not implemented");
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
