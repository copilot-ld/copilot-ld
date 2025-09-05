/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { hash } from "@copilot-ld/libtype/types.js";

/**
 * Base implementation for Hash gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class HashBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  async start() {
    const proto = await this.loadProto("hash.proto");
    const serviceDefinition = proto.Hash.service;

    const handlers = {};
    handlers.Sha256 = this.handleSha256;
    handlers.Md5 = this.handleMd5;

    return super.start(serviceDefinition, handlers);
  }

  /**
   * gRPC handler for `Sha256`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  async handleSha256(call) {
    const req = hash.HashRequest.fromObject(call.request);
    return this.Sha256(req);
  }

  /**
   * gRPC handler for `Md5`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  async handleMd5(call) {
    const req = hash.HashRequest.fromObject(call.request);
    return this.Md5(req);
  }

  /**
   * Implement the `Sha256` RPC.
   * @param { hash.HashRequest } _req - Typed request message.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  async Sha256(_req) {
    throw new Error("Not implemented");
  }

  /**
   * Implement the `Md5` RPC.
   * @param { hash.HashRequest } _req - Typed request message.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  async Md5(_req) {
    throw new Error("Not implemented");
  }
}
