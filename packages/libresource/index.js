/* eslint-env node */

import * as types from "@copilot-ld/libtype";
import { createStorage } from "@copilot-ld/libstorage";
import { createPolicy } from "@copilot-ld/libpolicy";

/**
 * Resource index for typed resource management with access control
 * @implements {import("@copilot-ld/libutil").IndexInterface}
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
   * Gets the storage instance
   * @returns {import("@copilot-ld/libstorage").StorageInterface} Storage instance
   */
  storage() {
    return this.#storage;
  }

  /**
   * Checks if a resource exists in the index
   * @param {string} id - Resource identifier
   * @returns {Promise<boolean>} True if the resource exists, false otherwise
   */
  async has(id) {
    if (!id) throw new Error("id is required");
    const key = `${id}.json`;
    return await this.#storage.exists(key);
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
   * Stores a resource in the index (alias for put)
   * @param {object} resource - Resource object to store
   * @returns {Promise<void>}
   */
  async add(resource) {
    return this.put(resource);
  }

  /**
   * Gets resources by their identifiers with optional access control
   * @param {string[]|null} ids - Array of resource identifiers, or null
   * @param {string} [actor] - Optional actor identifier for access control
   * @returns {Promise<import("@copilot-ld/libtype").resource.Resource[]>} Array of resources
   */
  async get(ids, actor = null) {
    // Handle null/undefined
    if (ids === null || ids === undefined) return [];
    if (!Array.isArray(ids)) throw new Error("ids must be an array or null");
    if (ids.length === 0) return [];

    // Evaluate access policy if actor is provided
    if (actor) {
      if (!(await this.#policy.evaluate({ actor, resources: ids }))) {
        throw new Error("Access denied");
      }
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
export function toType(object) {
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
 * @param {string} uri - Resource URI (e.g., "common.Message.abc123" or "parent/child/common.Message.abc123")
 * @returns {types.resource.Identifier} Identifier instance
 */
export function toIdentifier(uri) {
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

/**
 * Creates a ResourceIndex instance with configurable storage prefix.
 * BREAKING CHANGE: Signature changed from (storageType?, policy?) to (prefix, policy?)
 * @param {string} prefix - Storage prefix (bucket name) used to create the underlying storage
 * @param {import("@copilot-ld/libpolicy").Policy} [policy] - Optional policy instance (defaults to createPolicy())
 * @returns {ResourceIndex} Configured ResourceIndex instance
 */
export function createResourceIndex(prefix, policy = null) {
  if (!prefix) throw new Error("prefix is required");
  // Always use local storage type per new requirement while allowing custom prefix
  const storage = createStorage(prefix, "local");
  const policyInstance = policy || createPolicy();
  return new ResourceIndex(storage, policyInstance);
}
