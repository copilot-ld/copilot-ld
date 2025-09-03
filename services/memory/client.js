/* eslint-env node */
import { Client } from "@copilot-ld/libservice";
import { memory } from "@copilot-ld/libtype";

/**
 * Typed client for the Memory gRPC service with automatic type conversion.
 * Extends the `Client` class for shared gRPC client functionality.
 */
export class MemoryClient extends Client {
  /**
   * Call the `Append` RPC with request/response type conversion.
   * @param { memory.AppendRequest } req - Typed request message.
   * @returns {Promise<memory.AppendResponse>} Typed response message.
   */
  async Append(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("Append", request);
    return memory.AppendResponse.fromObject(response);
  }

  /**
   * Call the `GetWindow` RPC with request/response type conversion.
   * @param { memory.WindowRequest } req - Typed request message.
   * @returns {Promise<memory.Window>} Typed response message.
   */
  async GetWindow(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("GetWindow", request);
    return memory.Window.fromObject(response);
  }
}
