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
  Sha256(req: hash.HashRequest): Promise<hash.HashResponse>;
  /**
   * Call the `Md5` RPC with request/response type conversion.
   * @param { hash.HashRequest } req - Typed request message.
   * @returns {Promise<hash.HashResponse>} Typed response message.
   */
  Md5(req: hash.HashRequest): Promise<hash.HashResponse>;
}
import { Client } from "@copilot-ld/libservice";
import { hash } from "@copilot-ld/libtype";
