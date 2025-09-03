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
  Append(req: memory.AppendRequest): Promise<memory.AppendResponse>;
  /**
   * Call the `GetWindow` RPC with request/response type conversion.
   * @param { memory.WindowRequest } req - Typed request message.
   * @returns {Promise<memory.Window>} Typed response message.
   */
  GetWindow(req: memory.WindowRequest): Promise<memory.Window>;
}
import { Client } from "@copilot-ld/libservice";
import { memory } from "@copilot-ld/libtype";
