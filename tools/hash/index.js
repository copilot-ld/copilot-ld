/* eslint-env node */
import crypto from "node:crypto";

import { HashBase } from "./service.js";

/**
 * Simple Hash service implementing SHA-256 and MD5 hashing
 */
export class HashService extends HashBase {
  /** @inheritdoc */
  async Sha256(req) {
    if (!req.input) throw new Error("input is required");
    const hash = crypto.createHash("sha256").update(req.input).digest("hex");
    return { hash, algorithm: "sha256" };
  }

  /** @inheritdoc */
  async Md5(req) {
    if (!req.input) throw new Error("input is required");
    const hash = crypto.createHash("md5").update(req.input).digest("hex");
    return { hash, algorithm: "md5" };
  }
}

export { HashClient } from "./client.js";
