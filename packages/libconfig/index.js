/* eslint-env node */
import { config } from "dotenv";
import yaml from "js-yaml";

import { storageFactory } from "@copilot-ld/libstorage";

import {
  ConfigInterface,
  ExtensionConfigInterface,
  ServiceConfigInterface,
  ToolConfigInterface,
} from "./types.js";

/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */

/**
 * Centralized configuration management class
 * @implements {ConfigInterface}
 */
export class Config extends ConfigInterface {
  #envLoaded = false;
  #githubToken = null;
  #fileData = null;
  #storage = null;
  #process;
  #dotenv;
  #storageFn;

  /**
   * Creates a new Config instance (use Config.create() for async initialization)
   * @param {string} namespace - Namespace for the configuration (e.g., "server", "extension")
   * @param {string} name - Name of the configuration (used for environment variable prefix)
   * @param {object} defaults - Default configuration values
   * @param {object} process - Process environment access
   * @param {(options?: object) => object} dotenv - Dotenv config function
   * @param {(bucket: string, type?: string, process?: object) => StorageInterface} storageFn - Optional storage factory function that takes basePath and returns storage instance
   * @private
   */
  constructor(
    namespace,
    name,
    defaults = {},
    process = global.process,
    dotenv = config,
    storageFn = storageFactory,
  ) {
    super(namespace, name, defaults);
    this.#process = process;
    this.#dotenv = dotenv;
    this.#storageFn = storageFn;

    this.name = name;
    this.namespace = namespace;
  }

  /**
   * Creates and initializes a new Config instance asynchronously
   * @param {string} namespace - Namespace for the configuration (e.g., "server", "extension")
   * @param {string} name - Name of the configuration (used for environment variable prefix)
   * @param {object} defaults - Default configuration values
   * @param {object} process - Process environment access
   * @param {(options?: object) => object} dotenv - Dotenv config function
   * @param {(bucket: string, type?: string, process?: object) => StorageInterface} storageFn - Optional storage factory function that takes basePath and returns storage instance
   * @returns {Promise<Config>} Initialized Config instance
   */
  static async create(
    namespace,
    name,
    defaults = {},
    process = global.process,
    dotenv = config,
    storageFn = storageFactory,
  ) {
    const instance = new Config(
      namespace,
      name,
      defaults,
      process,
      dotenv,
      storageFn,
    );
    await instance.load();
    return instance;
  }

  /**
   * Loads the configuration by loading environment and config file
   * @returns {Promise<void>}
   */
  async load() {
    this.#storage = this.#storageFn("config");

    this.#loadEnv();
    await this.#loadFileData();

    const namespaceUpper = this.namespace.toUpperCase();
    const nameUpper = this.name.toUpperCase();
    const fileData = this.#getFileData(this.namespace, this.name);

    // Start with defaults and file config
    const data = { ...this.defaults, ...fileData };

    // Add standard service defaults
    if (data.host === undefined) data.host = "0.0.0.0";
    if (data.port === undefined) data.port = 3000;

    // Apply environment variable overrides (now includes host/port)
    for (const param of Object.keys(data)) {
      const varName = `${namespaceUpper}_${nameUpper}_${param.toUpperCase()}`;
      if (this.#process.env[varName] !== undefined) {
        try {
          data[param] = yaml.load(this.#process.env[varName]);
        } catch {
          data[param] = this.#process.env[varName];
        }
      }
    }

    Object.assign(this, data);
  }

  /** @inheritdoc */
  githubClientId() {
    this.#loadEnv();
    return this.#process.env.GITHUB_CLIENT_ID;
  }

  /** @inheritdoc */
  async githubToken() {
    if (this.#githubToken) return this.#githubToken;

    this.#loadEnv();

    const processEnv = this.#process.env;
    if (processEnv.GITHUB_TOKEN) {
      this.#githubToken = processEnv.GITHUB_TOKEN;
      return this.#githubToken;
    }

    try {
      if (await this.#storage.exists(".ghtoken")) {
        const tokenContent = await this.#storage.get(".ghtoken");
        this.#githubToken = tokenContent.toString().trim();
        return this.#githubToken;
      }
    } catch {
      // Continue to error
    }

    throw new Error("GitHub token not found in environment or .ghtoken file");
  }

  /** @inheritdoc */
  reset() {
    this.#envLoaded = false;
    this.#githubToken = null;
    this.#fileData = null;
    this.#storage = null;
  }

  /**
   * Loads environment variables from .env files
   * @returns {void}
   * @private
   */
  #loadEnv() {
    if (this.#envLoaded) return;

    // Only try to load .env file if storage is available
    if (this.#storage && this.#storage.path) {
      try {
        this.#dotenv({ path: this.#storage.path(".env"), quiet: true });
      } catch {
        // Ignore errors when loading .env file (e.g., file not found)
      }
    }

    this.#envLoaded = true;
    return;
  }

  /**
   * Loads configuration data from config.yml file using storage abstraction
   * @returns {Promise<void>}
   * @private
   */
  async #loadFileData() {
    if (this.#fileData !== null) return;

    try {
      const configContent = await this.#storage.get("config.yml");
      this.#fileData = yaml.load(configContent.toString()) || {};
    } catch {
      // config.yml is optional, so we just use an empty object if not found
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
 * @implements {ServiceConfigInterface}
 */
export class ServiceConfig extends Config {
  /** @inheritdoc */
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
 * @implements {ExtensionConfigInterface}
 */
export class ExtensionConfig extends Config {
  /** @inheritdoc */
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
 * Tool configuration class with environment variable support
 * @implements {ToolConfigInterface}
 */
export class ToolConfig extends Config {
  /** @inheritdoc */
  constructor(name, defaults = {}) {
    super("tool", name, defaults);
  }

  /**
   * Creates and initializes a new ToolConfig instance asynchronously
   * @param {string} name - Name of the tool configuration
   * @param {object} defaults - Default configuration values
   * @returns {Promise<ToolConfig>} Initialized ToolConfig instance
   */
  static async create(name, defaults = {}) {
    const instance = new ToolConfig(name, defaults);
    await instance.load();
    return instance;
  }
}

export {
  ConfigInterface,
  ExtensionConfigInterface,
  ServiceConfigInterface,
  ToolConfigInterface,
};
