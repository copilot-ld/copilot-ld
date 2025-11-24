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
  #configs;

  /**
   * Creates a new TenantConfigRepository instance.
   * Initializes an internal Map to store tenant configurations in memory.
   */
  constructor() {
    this.#configs = new Map();
  }

  /**
   * Get a configuration by tenant id.
   * @param {string} id - Tenant identifier
   * @returns {TenantConfig|null} The configuration instance or null if not found
   */
  get(id) {
    return this.#configs.get(id) || null;
  }

  /**
   * Save a configuration for a tenant id.
   * @param {string} id - Tenant identifier
   * @param {TenantConfig} config - Configuration instance to save
   */
  save(id, config) {
    this.#configs.set(id, config);
  }

  /**
   * Delete a configuration by tenant id.
   * @param {string} id - Tenant identifier
   */
  delete(id) {
    this.#configs.delete(id);
  }
}
