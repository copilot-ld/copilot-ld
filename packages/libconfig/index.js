/* eslint-env node */
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

import { config } from "dotenv";
import yaml from "js-yaml";

import {
  ConfigInterface,
  ExtensionConfigInterface,
  ServiceConfigInterface,
  ToolConfigInterface,
} from "./types.js";

/**
 * Centralized configuration management class
 * @implements {ConfigInterface}
 */
export class Config extends ConfigInterface {
  #envLoaded = false;
  #githubToken = null;
  #paths = new Map();
  #configData = null;
  #fs;
  #process;
  #dotenv;

  /**
   * Creates a new Config instance that spreads config parameters into the instance
   * @param {string} namespace - Namespace for the configuration (e.g., "server", "extension")
   * @param {string} name - Name of the configuration (used for environment variable prefix)
   * @param {object} defaults - Default configuration values
   * @param {object} fs - File system operations
   * @param {object} process - Process environment access
   * @param {Function} dotenv - Dotenv config function
   */
  constructor(
    namespace,
    name,
    defaults = {},
    fs = { existsSync, mkdirSync, readFileSync },
    process = global.process,
    dotenv = config,
  ) {
    super(namespace, name, defaults);
    this.#fs = fs;
    this.#process = process;
    this.#dotenv = dotenv;

    this.name = name;
    this.namespace = namespace;

    this.#loadEnv();
    this.#loadConfigFile();

    const namespaceUpper = namespace.toUpperCase();
    const nameUpper = name.toUpperCase();
    const fileConfig = this.#getConfigFromFile(namespace, name);

    // Start with defaults and file config
    const configData = { ...defaults, ...fileConfig };

    // Add standard service defaults
    if (configData.host === undefined) configData.host = "0.0.0.0";
    if (configData.port === undefined) configData.port = 3000;

    // Apply environment variable overrides (now includes host/port)
    for (const param of Object.keys(configData)) {
      const envVar = `${namespaceUpper}_${nameUpper}_${param.toUpperCase()}`;
      if (this.#process.env[envVar] !== undefined) {
        try {
          configData[param] = yaml.load(this.#process.env[envVar]);
        } catch {
          configData[param] = this.#process.env[envVar];
        }
      }
    }

    Object.assign(this, configData);
  }

  /** @inheritdoc */
  dataPath(path = "") {
    return this.#findPath(`data/${path}`, true);
  }

  /** @inheritdoc */
  githubClientId() {
    this.#loadEnv();
    return this.#process.env.GITHUB_CLIENT_ID;
  }

  /** @inheritdoc */
  githubToken() {
    if (this.#githubToken) return this.#githubToken;

    this.#loadEnv();

    const processEnv = this.#process.env;
    if (processEnv.GITHUB_TOKEN) {
      this.#githubToken = processEnv.GITHUB_TOKEN;
      return this.#githubToken;
    }

    const tokenPath = this.#findPath(".ghtoken");
    this.#githubToken = this.#fs.readFileSync(tokenPath, "utf8").trim();
    return this.#githubToken;
  }

  /** @inheritdoc */
  publicPath(path = "") {
    return this.#findPath(`public/${path}`);
  }

  /** @inheritdoc */
  protoFile(name) {
    return this.#findPath(`proto/${name}.proto`);
  }

  /** @inheritdoc */
  reset() {
    this.#envLoaded = false;
    this.#githubToken = null;
    this.#paths.clear();
    this.#configData = null;
  }

  /**
   * Loads configuration from config.yml file
   * @returns {void}
   * @private
   */
  #loadConfigFile() {
    if (this.#configData !== null) return;

    try {
      const configPath = this.#findPath("config.yml");
      const configContent = this.#fs.readFileSync(configPath, "utf8");
      this.#configData = yaml.load(configContent) || {};
    } catch {
      // config.yml is optional, so we just use an empty object if not found
      this.#configData = {};
    }
  }

  /**
   * Gets configuration values from the loaded config file
   * @param {string} namespace - Configuration namespace
   * @param {string} name - Configuration name
   * @returns {object} Configuration object from file or empty object
   * @private
   */
  #getConfigFromFile(namespace, name) {
    if (!this.#configData?.[namespace]?.[name]) {
      return {};
    }
    return this.#configData[namespace][name];
  }

  /**
   * Finds a directory by searching current dir and up to 2 levels up
   * @param {string} path - Path to search for
   * @param {boolean} createIfMissing - Whether to create path if not found
   * @returns {string} Absolute path to found or created directory
   * @throws {Error} When path is not found and createIfMissing is false
   * @private
   */
  #findPath(path, createIfMissing = false) {
    if (this.#paths.has(path)) return this.#paths.get(path);

    const cwd = this.#process.cwd();
    const searchPaths = [".", "..", "../.."].map((dir) => join(cwd, dir, path));

    for (const searchPath of searchPaths) {
      if (this.#fs.existsSync(searchPath)) {
        this.#paths.set(path, searchPath);
        return searchPath;
      }
    }

    if (createIfMissing) {
      this.#fs.mkdirSync(searchPaths[0], { recursive: true });
      this.#paths.set(path, searchPaths[0]);
      return searchPaths[0];
    }

    throw new Error(`${path} not found`);
  }

  /**
   * Loads environment variables from .env files
   * @returns {void}
   * @private
   */
  #loadEnv() {
    if (this.#envLoaded) return;

    try {
      const path = this.#findPath(".env");
      this.#dotenv({ path, quiet: true });
    } catch (error) {
      console.warn("Warning:", error.message);
    }
    this.#envLoaded = true;
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
}

export {
  ConfigInterface,
  ExtensionConfigInterface,
  ServiceConfigInterface,
  ToolConfigInterface,
};
