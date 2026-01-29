/**
 * Storage wrapper for learned experience with JSON serialization
 */
export class ExperienceStore {
  #storage;

  /**
   * Creates a new ExperienceStore instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage backend
   */
  constructor(storage) {
    if (!storage) throw new Error("storage is required");
    this.#storage = storage;
  }

  /**
   * Gets experience by key
   * @param {string} key - Experience key (e.g., "current")
   * @returns {Promise<object|null>} Experience object or null if not found
   */
  async get(key) {
    const exists = await this.#storage.exists(`${key}.json`);
    if (!exists) return null;
    return await this.#storage.get(`${key}.json`);
  }

  /**
   * Stores experience by key
   * @param {string} key - Experience key
   * @param {object} experience - Experience object to store
   * @returns {Promise<void>}
   */
  async put(key, experience) {
    if (!key) throw new Error("key is required");
    if (!experience) throw new Error("experience is required");

    await this.#storage.put(`${key}.json`, experience);
  }
}
