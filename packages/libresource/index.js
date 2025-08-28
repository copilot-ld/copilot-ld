/* eslint-env node */

import { StorageInterface } from "@copilot-ld/libstorage";
import * as types from "@copilot-ld/libtype";

import { ResourceIndexInterface, ResourceProcessorInterface } from "./types.js";
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

    if (!id) {
      throw new Error("Missing resource identifier");
    }

    await this.#storage.put(`${id}.json`, JSON.stringify(object));
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

    // Convert object values to array and parse JSON in parallel
    const promises = Object.values(data).map((d) =>
      Promise.resolve(toType(JSON.parse(d.toString()))),
    );
    return await Promise.all(promises);
  }

  /** @inheritdoc */
  async getAll(actor) {
    if (!actor) throw new Error("actor is required");

    // Get all keys from storage
    const keys = await this.#storage.list();

    // Filter for .json files and extract resource IDs (URIs)
    const ids = keys
      .filter((key) => key.endsWith(".json"))
      .map((key) => key.slice(0, -5)); // Remove .json extension

    return await this.get(actor, ids);
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

export {
  toType,
  ResourceProcessor,
  ResourceIndexInterface,
  ResourceProcessorInterface,
};
