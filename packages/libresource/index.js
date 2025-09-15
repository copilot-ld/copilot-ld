/* eslint-env node */

import { StorageInterface } from "@copilot-ld/libstorage";
import * as types from "@copilot-ld/libtype";

import { ResourceIndexInterface } from "./types.js";
import { ResourceProcessor } from "./processor.js";

/**
 * Resource index for typed resource management with access control
 * @implements {ResourceIndexInterface}
 */
export class ResourceIndex extends ResourceIndexInterface {
  #storage;
  #policy;

  /**
   * Creates a new ResourceIndex
   * @param {StorageInterface} storage - Storage backend for persistence
   * @param {object} policy - Policy engine for access control
   */
  constructor(storage, policy) {
    super();
    if (!storage) throw new Error("storage is required");
    if (!policy) throw new Error("policy is required");

    this.#storage = storage;
    this.#policy = policy;
  }

  /** @inheritdoc */
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

  /** @inheritdoc */
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

  /** @inheritdoc */
  async findAll() {
    // Get all keys from storage
    const keys = await this.#storage.findByPrefix("");

    // Filter for .json files and extract resource IDs (names)
    const names = keys
      .filter((key) => key.endsWith(".json"))
      .map((key) => key.slice(0, -5)); // Remove .json extension

    // Names already include "cld:" prefix, so use them directly
    return names.map((name) => toIdentifier(name));
  }

  /** @inheritdoc */
  async findByPrefix(prefix) {
    if (!prefix) throw new Error("prefix is required");

    // Use the prefix directly as it should already include "cld:"
    const searchPrefix = prefix;

    // Get keys with the specified prefix from storage
    const keys = await this.#storage.findByPrefix(searchPrefix);

    // Filter for .json files and extract resource IDs (names)
    const names = keys
      .filter((key) => key.endsWith(".json"))
      .map((key) => key.slice(0, -5)); // Remove .json extension

    // Names already include "cld:" prefix, so use them directly
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
 * @param {string} uri - Resource URI starting with "cld:" (e.g., "cld:common.MessageV2.abc123" or "cld:parent/child/common.MessageV2.abc123")
 * @returns {types.resource.Identifier} Identifier instance
 */
function toIdentifier(uri) {
  const path = uri.slice(4); // Remove "cld:" prefix
  const pathParts = path.split("/");

  // The last part is the name, everything before is the parent path
  const nameParts = pathParts[pathParts.length - 1].split(".");
  const parentParts = pathParts.slice(0, -1);

  // Extract type from name (format: "namespace.Type.hash")
  const name = nameParts.pop();
  const type = `${nameParts[0]}.${nameParts[1]}`;

  // Build parent URI if there are parent parts
  const parent = parentParts.length > 0 ? `cld:${parentParts.join("/")}` : "";

  return new types.resource.Identifier({
    type: type,
    name: name,
    parent: parent,
  });
}

export { toType, toIdentifier, ResourceProcessor, ResourceIndexInterface };
