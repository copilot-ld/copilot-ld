/* eslint-env node */
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
   * Save configuration for a tenant.
   * @param {string} tenantId - Tenant identifier
   * @param {string} host - Tenant host
   * @param {number} port - Tenant port
   * @param {string} secret - Tenant secret (if empty, existing secret is preserved)
   * @returns {Promise<void>}
   */
  async saveTenantConfig(tenantId, host, port, secret) {
    let encryptedSecret;
    if (!secret) {
      const existingConfig = await this.#configRepository.get(tenantId);
      encryptedSecret = existingConfig?.encryptedSecret || "";
    } else {
      encryptedSecret = this.#encryption.encrypt(tenantId, secret);
    }
    const config = new TenantConfig(host, port, encryptedSecret);
    await this.#configRepository.save(tenantId, config);
  }

  /**
   * Get tenant configuration (host and port only, without secret).
   * @param {string} tenantId - Tenant identifier
   * @returns {Promise<BasicTenantConfig|null>} Object with host and port, or null if not found
   */
  async getTenantConfig(tenantId) {
    const config = await this.#configRepository.get(tenantId);
    if (!config) return null;

    return {
      host: config.host,
      port: config.port,
    };
  }
}
