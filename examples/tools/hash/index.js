/* eslint-env node */
import crypto from "node:crypto";
import { services } from "@copilot-ld/librpc";

const { HashBase } = services;

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
    const hash = crypto.createHash(algorithm).update(input).digest("hex");
    return { hash, algorithm };
  }
}
