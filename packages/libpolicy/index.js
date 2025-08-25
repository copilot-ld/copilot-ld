/* eslint-env node */
import { StorageInterface } from "@copilot-ld/libstorage";

import { PolicyInterface } from "./types.js";

/**
 * Simple policy engine that returns static "allow" for all requests
 * Future versions will integrate with @openpolicyagent/opa-wasm
 * @implements {PolicyInterface}
 */
export class Policy extends PolicyInterface {
  #storage;

  /**
   * Creates a new Policy instance
   * @param {StorageInterface} storage - Storage backend for policy loading
   */
  constructor(storage) {
    super();
    if (!storage) {
      throw new Error("storage is required");
    }
    if (!(storage instanceof StorageInterface)) {
      throw new Error("storage must be a StorageInterface instance");
    }
    this.#storage = storage;
  }

  /** @inheritdoc */
  async load() {
    // TODO: Future implementation will load policies from storage
    // Check if storage is available for future policy loading
    await this.#storage.bucketExists();
  }

  /** @inheritdoc */
  async evaluate(input) {
    if (!input) {
      throw new Error("input is required");
    }
    if (!input.actor || typeof input.actor !== "string") {
      throw new Error("input.actor must be a non-empty string");
    }
    if (!Array.isArray(input.resources)) {
      throw new Error("input.resources must be an array");
    }

    // Static allow for initial implementation
    // TODO: Future implementation will use @openpolicyagent/opa-wasm
    return true;
  }
}

export { PolicyInterface };
