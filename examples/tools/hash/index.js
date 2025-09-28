/* eslint-env node */
import crypto from "node:crypto";

import { services, clients } from "@copilot-ld/librpc";
import { hash } from "@copilot-ld/libtype";

const { HashBase } = services;
const { HashClient } = clients;

/**
 * Simple Hash service implementing SHA-256 and MD5 hashing
 */
class HashService extends HashBase {
  /**
   * Creates a new Hash service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, logFn) {
    super(config, logFn);
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
   * @returns {hash.HashResponse} The resulting hash in hexadecimal format
   */
  #createHash(input, algorithm) {
    this.debug("Hashing", { algorithm, input });
    const hash = crypto.createHash(algorithm).update(input).digest("hex");
    return { hash, algorithm };
  }
}

// Export the service class and client
export { HashService, HashClient };
