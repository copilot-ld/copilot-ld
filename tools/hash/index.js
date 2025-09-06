/* eslint-env node */
import crypto from "node:crypto";

import { HashBase } from "../../generated/tools/hash/service.js";

/**
 * Simple Hash service implementing SHA-256 and MD5 hashing
 */
export class HashService extends HashBase {
  /** @inheritdoc */
  async Sha256(req) {
    if (!req.input) throw new Error("input is required");
    return this.#hash(req.input, "sha256");
  }

  /** @inheritdoc */
  async Md5(req) {
    if (!req.input) throw new Error("input is required");
    return this.#hash(req.input, "md5");
  }

  /**
   * Hashes the input using the specified algorithm.
   * @param {string} input – The input string to hash
   * @param {string} algorithm - The algorithm to use (e.g., 'sha256', 'md5')
   * @returns {import("../../generated/types/types.js").hash.HashResponse} The resulting hash in hexadecimal format
   */
  #hash(input, algorithm) {
    this.debug("Hashing", { algorithm, input });
    const hash = crypto.createHash(algorithm).update(input).digest("hex");
    return { hash, algorithm };
  }
}

export { HashClient } from "../../generated/tools/hash/client.js";
