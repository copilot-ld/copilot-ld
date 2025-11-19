/* eslint-env node */
import crypto from "node:crypto";

import { HashBase } from "../../generated/services/hash/service.js";

/**
 * Simple Hash service implementing SHA-256 and MD5 hashing
 */
export class HashService extends HashBase {
  /**
   * Creates a new Hash service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   */
  constructor(config) {
    super(config);
  }

  /** @inheritdoc */
  async Sha256(req) {
    if (!req.input) throw new Error("input is required");
    return this.#createHash(req.input, "sha256");
  }

  /** @inheritdoc */
  async Md5(req) {
    if (!req.input) throw new Error("input is required");
    return this.#createHash(req.input, "md5");
  }

  /**
   * Creates a hash of the input using the specified algorithm.
   * @param {string} input – The input string to hash
   * @param {string} algorithm - The algorithm to use (e.g., 'sha256', 'md5')
   * @returns {import("../../generated/types/types.js").hash.HashResponse} The resulting hash in hexadecimal format
   */
  #createHash(input, algorithm) {
    this.debug("Hashing", { algorithm, input });
    const hash = crypto.createHash(algorithm).update(input).digest("hex");
    return { hash, algorithm };
  }
}

// Export the service class (no bootstrap code here)
export { HashClient } from "../../generated/services/hash/client.js";
