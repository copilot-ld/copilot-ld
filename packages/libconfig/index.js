/* eslint-env node */
import { createStorage } from "@copilot-ld/libstorage";

/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

/**
 * Centralized configuration management class
 */
export class Config {
  #githubToken = null;
  #fileData = null;
  #storage = null;
  #process;
  #storageFn;

  /**
   * Creates a new Config instance (use Config.create() for async initialization)
   * @param {string} namespace - Namespace for the configuration (e.g., "server", "extension")
   * @param {string} name - Name of the configuration (used for environment variable prefix)
   * @param {object} defaults - Default configuration values
   * @param {object} process - Process environment access
   * @param {(bucket: string, type?: string, process?: object) => StorageInterface} storageFn - Optional storage factory function that takes basePath and returns storage instance
   * @private
   */
  constructor(
    namespace,
    name,
    defaults = {},
    process = global.process,
    storageFn = createStorage,
  ) {
    this.#process = process;
    this.#storageFn = storageFn;

    this.name = name;
    this.namespace = namespace;
    this.defaults = defaults;
  }

  /**
   * Creates and initializes a new Config instance asynchronously
   * @param {string} namespace - Namespace for the configuration (e.g., "server", "extension")
   * @param {string} name - Name of the configuration (used for environment variable prefix)
   * @param {object} defaults - Default configuration values
   * @param {object} process - Process environment access
   * @param {(bucket: string, type?: string, process?: object) => StorageInterface} storageFn - Optional storage factory function that takes basePath and returns storage instance
   * @returns {Promise<Config>} Initialized Config instance
   */
  static async create(
    namespace,
    name,
    defaults = {},
    process = global.process,
    storageFn = createStorage,
  ) {
    const instance = new Config(namespace, name, defaults, process, storageFn);
    await instance.load();
    return instance;
  }

  /**
   * Loads the configuration by loading environment and config file
   * @returns {Promise<void>}
   */
  async load() {
    this.#storage = this.#storageFn("config");

    await this.#loadFileData();

    const namespaceUpper = this.namespace.toUpperCase();
    const nameUpper = this.name.toUpperCase();
    const fileData = this.#getFileData(this.namespace, this.name);

    const data = { ...this.defaults, ...fileData };

    if (data.host === undefined) data.host = "0.0.0.0";
    if (data.port === undefined) data.port = 3000;

    for (const param of Object.keys(data)) {
      const varName = `${namespaceUpper}_${nameUpper}_${param.toUpperCase()}`;
      if (this.#process.env[varName] !== undefined) {
        try {
          data[param] = JSON.parse(this.#process.env[varName]);
        } catch {
          data[param] = this.#process.env[varName];
        }
      }
    }

    Object.assign(this, data);
  }

  /**
   * Gets the GitHub client ID from environment variable
   * @returns {string} GitHub client ID
   */
  githubClientId() {
    return this.#process.env.GITHUB_CLIENT_ID;
  }

  /**
   * Gets the GitHub token from environment variable
   * @returns {Promise<string>} GitHub token
   */
  async githubToken() {
    if (this.#githubToken) return this.#githubToken;

    const processEnv = this.#process.env;
    if (processEnv.GITHUB_TOKEN) {
      this.#githubToken = processEnv.GITHUB_TOKEN;
      return this.#githubToken;
    }

    throw new Error("GitHub token not found in environment");
  }

  /**
   * Resets cached values (useful for testing)
   * @returns {void}
   */
  reset() {
    this.#githubToken = null;
    this.#fileData = null;
    this.#storage = null;
  }

  /**
   * Loads configuration data from config.json file using storage abstraction
   * @returns {Promise<void>}
   * @private
   */
  async #loadFileData() {
    if (this.#fileData !== null) return;

    try {
      const configContent = await this.#storage.get("config.json");
      this.#fileData = configContent || {};
    } catch {
      this.#fileData = {};
    }
  }

  /**
   * Gets configuration values from the loaded config file
   * @param {string} namespace - Configuration namespace
   * @param {string} name - Configuration name
   * @returns {object} Configuration object from file or empty object
   * @private
   */
  #getFileData(namespace, name) {
    if (!this.#fileData?.[namespace]?.[name]) {
      return {};
    }
    return this.#fileData[namespace][name];
  }
}

/**
 * Service configuration class with environment variable support
 */
export class ServiceConfig extends Config {
  /**
   * Creates a service configuration instance
   * @param {string} name - Service name for environment variable prefix
   * @param {object} defaults - Default configuration values
   */
  constructor(name, defaults = {}) {
    super("service", name, defaults);
  }

  /**
   * Creates and initializes a new ServiceConfig instance asynchronously
   * @param {string} name - Name of the service configuration
   * @param {object} defaults - Default configuration values
   * @returns {Promise<ServiceConfig>} Initialized ServiceConfig instance
   */
  static async create(name, defaults = {}) {
    const instance = new ServiceConfig(name, defaults);
    await instance.load();
    return instance;
  }
}

/**
 * Extension configuration class with environment variable support
 */
export class ExtensionConfig extends Config {
  /**
   * Creates an extension configuration instance
   * @param {string} name - Extension name for environment variable prefix
   * @param {object} defaults - Default configuration values
   */
  constructor(name, defaults = {}) {
    super("extension", name, defaults);
  }

  /**
   * Creates and initializes a new ExtensionConfig instance asynchronously
   * @param {string} name - Name of the extension configuration
   * @param {object} defaults - Default configuration values
   * @returns {Promise<ExtensionConfig>} Initialized ExtensionConfig instance
   */
  static async create(name, defaults = {}) {
    const instance = new ExtensionConfig(name, defaults);
    await instance.load();
    return instance;
  }
}

/**
 * Script configuration class with environment variable support
 */
export class ScriptConfig extends Config {
  /**
   * Creates a script configuration instance
   * @param {string} name - Script name for environment variable prefix
   * @param {object} defaults - Default configuration values
   */
  constructor(name, defaults = {}) {
    super("script", name, defaults);
  }

  /**
   * Creates and initializes a new ScriptConfig instance asynchronously
   * @param {string} name - Name of the script configuration
   * @param {object} defaults - Default configuration values
   * @returns {Promise<ScriptConfig>} Initialized ScriptConfig instance
   */
  static async create(name, defaults = {}) {
    const instance = new ScriptConfig(name, defaults);
    await instance.load();
    return instance;
  }
}
