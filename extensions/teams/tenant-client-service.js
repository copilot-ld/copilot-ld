/* eslint-env node */
import { clients, Interceptor, HmacAuth } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { TenantConfig } from "./tenant-config-repository.js";

/**
 * @typedef {object} BasicTenantConfig
 * @property {string} host - Tenant host
 * @property {number} port - Tenant port
 */

/**
 * Repository for managing tenant-specific clients in memory.
 */
export class TenantClientService {
  #configRepository;
  #encryption;

  /**
   * Creates a new TenantClientRepository instance.
   * @param {import('./tenant-config-repository.js').TenantConfigRepository} configRepository - Repository for tenant configurations
   * @param {import('./tenant-secret-encryption.js').TenantSecretEncryption} encryption - Encryption service for tenant secrets
   */
  constructor(configRepository, encryption) {
    if (!configRepository) throw new Error("configRepository is required");
    if (!encryption) throw new Error("encryption is required");
    this.#configRepository = configRepository;
    this.#encryption = encryption;
  }

  /**
   * Get a client by tenant id.
   * @param {string} id - Tenant identifier
   * @returns {Promise<import("@copilot-ld/librpc").clients.AgentClient|null>} The client instance or null if not found
   */
  async getTenantClient(id) {
    const config = this.#configRepository.get(id);
    if (!config) return null;

    const secret = this.#encryption.decrypt(id, config.encryptedSecret);
    return await this.#buildClient(config.host, config.port, secret);
  }

  /**
   * Save configuration for a tenant.
   * @param {string} tenantId - Tenant identifier
   * @param {string} host - Tenant host
   * @param {number} port - Tenant port
   * @param {string} secret - Tenant secret (if empty, existing secret is preserved)
   */
  saveTenantConfig(tenantId, host, port, secret) {
    let encryptedSecret;
    if (!secret) {
      const existingConfig = this.#configRepository.get(tenantId);
      encryptedSecret = existingConfig?.encryptedSecret || "";
    } else {
      encryptedSecret = this.#encryption.encrypt(tenantId, secret);
    }
    const config = new TenantConfig(host, port, encryptedSecret);
    this.#configRepository.save(tenantId, config);
  }

  /**
   * Get tenant configuration (host and port only, without secret).
   * @param {string} tenantId - Tenant identifier
   * @returns {BasicTenantConfig|null} Object with host and port, or null if not found
   */
  getTenantConfig(tenantId) {
    const config = this.#configRepository.get(tenantId);
    if (!config) return null;

    return {
      host: config.host,
      port: config.port,
    };
  }

  /**
   * Builds and returns an AgentClient with overridden config values.
   * @private
   * @param {string} host - The agent service host
   * @param {number} port - The agent service port
   * @param {string} secret - The agent service secret
   * @returns {Promise<import("@copilot-ld/librpc").clients.AgentClient>} Initialized AgentClient instance
   */
  async #buildClient(host, port, secret) {
    const serviceConfig = await createServiceConfig("agent");
    if (host !== undefined) serviceConfig.host = host;
    if (port !== undefined) serviceConfig.port = port;

    const createAuth = () => {
      return new Interceptor(new HmacAuth(secret), serviceConfig.name);
    };

    return new clients.AgentClient(serviceConfig, null, null, createAuth);
  }
}
