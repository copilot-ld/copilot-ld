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

    // Ensure metadata is generated before persisting
    resource.withMeta();
    const object = resource.toJSON();

    const id = object.meta.id;

    if (!id) {
      throw new Error("ID missing from resource metadata");
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
    return data.map((d) => toType(JSON.parse(d.toString())));
  }
}

/**
 * Helper function creating object instances of the right type from resource metadata
 * @param {object} object - Plain object with type information
 * @returns {object} Typed object instance
 */
function toType(object) {
  if (!object.meta?.id && !object.meta?.type) {
    throw new Error("Object must have metadata");
  }

  let ns, type;

  if (object.meta?.id) {
    const [, path] = object.meta.id.split(":");
    [ns, type] = path.split("/").pop().split(".");
    // Force meta.type with the derived type to ensure integrity
    object.meta.type = `${ns}.${type}`;
  } else if (object.meta?.type) {
    const typeParts = object.meta.type.split(".");
    if (typeParts.length !== 2) {
      throw new Error(
        `Type must have exactly 2 parts (namespace.type): ${object.meta.type}`,
      );
    }
    [ns, type] = typeParts;
  }

  if (!ns || !type) {
    throw new Error(`Incorrectly formatted type: ${object.meta.type}`);
  }

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
