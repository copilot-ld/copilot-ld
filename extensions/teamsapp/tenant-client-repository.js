/* eslint-env node */

/**
 * Repository for managing tenant-specific clients in memory.
 */
export class TenantClientRepository {
  #clients;

  /**
   * Creates a new TenantClientRepository instance.
   * Initializes an internal Map to store tenant clients in memory.
   */
  constructor() {
    this.#clients = new Map();
  }

  /**
   * Get a client by tenant id.
   * @param {string} id - Tenant identifier
   * @returns {any|null} The client instance or null if not found
   */
  get(id) {
    return this.#clients.get(id) || null;
  }

  /**
   * Save a client for a tenant id.
   * @param {string} id - Tenant identifier
   * @param {any} client - Client instance to save
   */
  save(id, client) {
    this.#clients.set(id, client);
  }

  /**
   * Delete a client by tenant id.
   * @param {string} id - Tenant identifier
   */
  delete(id) {
    this.#clients.delete(id);
  }
}
