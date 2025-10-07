/* eslint-env node */

import * as types from "@copilot-ld/libtype";

/**
 * Resource index for typed resource management with access control
 */
export class ResourceIndex {
  #storage;
  #policy;

  /**
   * Creates a new ResourceIndex
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage backend for persistence
   * @param {import("@copilot-ld/libpolicy").Policy} policy - Policy engine for access control
   */
  constructor(storage, policy) {
    if (!storage) throw new Error("storage is required");
    if (!policy) throw new Error("policy is required");

    this.#storage = storage;
    this.#policy = policy;
  }

  /**
   * Stores a resource in the index
   * @param {object} resource - Resource object to store
   * @returns {Promise<void>}
   */
  async put(resource) {
    if (!resource) throw new Error("resource is required");

    // Ensure that the resource identifier is generated
    resource.withIdentifier();

    // Ensure that tokens are counted
    resource.withTokens();

    const id = resource.id;
    const object = resource.toJSON();
    const data = JSON.stringify(object);

    if (!id) {
      throw new Error("Missing resource identifier");
    }

    await this.#storage.put(`${id}.json`, data);
  }

  /**
   * Gets resources by their identifiers with access control
   * @param {string} actor - Actor identifier for access control
   * @param {string[]} ids - Array of resource identifiers
   * @returns {Promise<import("@copilot-ld/libtype").resource.Resource[]>} Array of resources
   */
  async get(actor, ids) {
    if (!actor) throw new Error("actor is required");
    if (!Array.isArray(ids)) throw new Error("ids must be an array");

    // Evaluate access policy
    if (!(await this.#policy.evaluate({ actor, resources: ids }))) {
      throw new Error("Access denied");
    }

    const keys = ids.map((id) => `${id}.json`);
    const data = await this.#storage.getMany(keys);

    // Convert object values to array and apply type conversion
    const promises = Object.values(data).map((d) => Promise.resolve(toType(d)));
    return await Promise.all(promises);
  }

  /**
   * Finds all resources in the index
   * @returns {Promise<import("@copilot-ld/libtype").resource.Identifier[]>} Array of resource identifiers
   */
  async findAll() {
    // Get all keys from storage
    const keys = await this.#storage.findByPrefix("");

    // Filter for .json files and extract resource IDs (names)
    const names = keys
      .filter((key) => key.endsWith(".json"))
      .map((key) => key.slice(0, -5)); // Remove .json extension

    // Names are identifiers, so use them directly
    return names.map((name) => toIdentifier(name));
  }

  /**
   * Finds resources by URI prefix
   * @param {string} prefix - URI prefix to match
   * @returns {Promise<import("@copilot-ld/libtype").resource.Identifier[]>} Array of matching resource identifiers
   */
  async findByPrefix(prefix) {
    if (!prefix) throw new Error("prefix is required");

    // Use the prefix directly
    const searchPrefix = prefix;

    // Get keys with the specified prefix from storage
    const keys = await this.#storage.findByPrefix(searchPrefix);

    // Filter for .json files and extract resource IDs (names)
    const names = keys
      .filter((key) => key.endsWith(".json"))
      .map((key) => key.slice(0, -5)); // Remove .json extension

    // Names are identifiers, so use them directly
    return names.map((name) => toIdentifier(name));
  }
}

/**
 * Helper function creating object instances of the right type from resource descriptor
 * @param {object} object - Plain object with type information
 * @returns {object} Typed object content
 */
function toType(object) {
  if (!object?.id?.type) {
    throw new Error("Object must have an identifier");
  }

  const [ns, type] = object.id.type.split(".");

  if (!types[ns] || !types[ns][type]) {
    throw new Error(`Unknown type: ${ns}.${type}`);
  }

  return types[ns][type].fromObject(object);
}

/**
 * Helper function creating Identifier instance from resource URI - reverse of resource.Identifier.toString()
 * @param {string} uri - Resource URI (e.g., "common.MessageV2.abc123" or "parent/child/common.MessageV2.abc123")
 * @returns {types.resource.Identifier} Identifier instance
 */
function toIdentifier(uri) {
  const tree = uri.split("/");

  // The last part is the name, everything before is the parent path
  const nameParts = tree[tree.length - 1].split(".");
  const parentParts = tree.slice(0, -1);

  // Extract type from name (format: "namespace.Type.hash")
  const name = nameParts.pop();
  const type = `${nameParts[0]}.${nameParts[1]}`;

  // Build parent URI if there are parent parts
  const parent = parentParts.length > 0 ? parentParts.join("/") : "";

  return new types.resource.Identifier({
    type: type,
    name: name,
    parent: parent,
  });
}

export { toType, toIdentifier };
