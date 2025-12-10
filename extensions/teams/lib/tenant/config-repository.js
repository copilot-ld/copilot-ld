import { createStorage } from "@copilot-ld/libstorage";

/* eslint-env node */

/**
 * Configuration for a tenant
 */
export class TenantConfig {
  #host;
  #port;
  #encryptedSecret;

  /**
   * Creates a new TenantConfig instance
   * @param {string} host - Tenant host
   * @param {number} port - Tenant port
   * @param {object} encryptedSecret - Encrypted secret object from TenantSecretEncryption
   */
  constructor(host, port, encryptedSecret) {
    if (!host) throw new Error("host is required");
    if (!port) throw new Error("port is required");
    if (!encryptedSecret) throw new Error("encryptedSecret is required");

    this.#host = host;
    this.#port = port;
    this.#encryptedSecret = encryptedSecret;
  }

  /**
   * Get the host
   * @returns {string} The host
   */
  get host() {
    return this.#host;
  }

  /**
   * Get the port
   * @returns {number} The port
   */
  get port() {
    return this.#port;
  }

  /**
   * Get the encrypted secret
   * @returns {object} The encrypted secret object
   */
  get encryptedSecret() {
    return this.#encryptedSecret;
  }
}

/**
 * Repository for managing tenant configurations in memory.
 */
export class TenantConfigRepository {
  #storage;

  /**
   * Creates a new TenantConfigRepository instance.
   * Initializes an internal storage to store tenant configurations.
   */
  constructor() {
    this.#storage = createStorage("teams-tenant-configs");
  }

  /**
   * Get a configuration by tenant id.
   * @param {string} id - Tenant identifier
   * @returns {Promise<TenantConfig|null>} The configuration instance or null if not found
   */
  async get(id) {
    try {
      const data = await this.#storage.get(`${id}.json`);
      if (!data) return null;
      return new TenantConfig(data.host, data.port, data.encryptedSecret);
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  /**
   * Save a configuration for a tenant id.
   * @param {string} id - Tenant identifier
   * @param {TenantConfig} config - Configuration instance to save
   */
  async save(id, config) {
    const data = {
      host: config.host,
      port: config.port,
      encryptedSecret: config.encryptedSecret,
    };
    await this.#storage.put(`${id}.json`, data);
  }

  /**
   * Delete a configuration by tenant id.
   * @param {string} id - Tenant identifier
   */
  async delete(id) {
    try {
      await this.#storage.delete(`${id}.json`);
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
  }
}
