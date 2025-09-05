/**
 * Base implementation for Hash gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class HashBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  start(): Promise<number>;
  /**
   * gRPC handler for `Sha256`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  handleSha256(call: object): Promise<hash.HashResponse>;
  /**
   * gRPC handler for `Md5`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  handleMd5(call: object): Promise<hash.HashResponse>;
  /**
   * Implement the `Sha256` RPC.
   * @param { hash.HashRequest } _req - Typed request message.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  Sha256(_req: hash.HashRequest): Promise<hash.HashResponse>;
  /**
   * Implement the `Md5` RPC.
   * @param { hash.HashRequest } _req - Typed request message.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  Md5(_req: hash.HashRequest): Promise<hash.HashResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { hash } from "@copilot-ld/libtype";
