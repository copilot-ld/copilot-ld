/* eslint-env node */
import { Client } from "@copilot-ld/libservice";
import { hash } from "@copilot-ld/libtype/types.js";

/**
 * Typed client for the Hash gRPC service with automatic type conversion.
 * Extends the `Client` class for shared gRPC client functionality.
 */
export class HashClient extends Client {
  /**
   * Call the `Sha256` RPC with request/response type conversion.
   * @param { hash.HashRequest } req - Typed request message.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  async Sha256(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("Sha256", request);
    return hash.HashResponse.fromObject(response);
  }

  /**
   * Call the `Md5` RPC with request/response type conversion.
   * @param { hash.HashRequest } req - Typed request message.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  async Md5(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("Md5", request);
    return hash.HashResponse.fromObject(response);
  }
}
