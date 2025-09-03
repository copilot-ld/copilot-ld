/**
 * Base implementation for Memory gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class MemoryBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  start(): Promise<number>;
  /**
   * gRPC handler for `Append`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<memory.AppendResponse>} Typed response message.
   */
  handleAppend(call: object): Promise<memory.AppendResponse>;
  /**
   * gRPC handler for `GetWindow`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<memory.Window>} Typed response message.
   */
  handleGetWindow(call: object): Promise<memory.Window>;
  /**
   * Implement the `Append` RPC.
   * @param { memory.AppendRequest } _req - Typed request message.
   * @returns {Promise<memory.AppendResponse>} Typed response message.
   */
  Append(_req: memory.AppendRequest): Promise<memory.AppendResponse>;
  /**
   * Implement the `GetWindow` RPC.
   * @param { memory.WindowRequest } _req - Typed request message.
   * @returns {Promise<memory.Window>} Typed response message.
   */
  GetWindow(_req: memory.WindowRequest): Promise<memory.Window>;
}
import { Service } from "@copilot-ld/libservice";
import { memory } from "@copilot-ld/libtype";
