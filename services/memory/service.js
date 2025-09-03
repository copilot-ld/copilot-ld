/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { memory } from "@copilot-ld/libtype";

/**
 * Base implementation for Memory gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class MemoryBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  async start() {
    const proto = await this.loadProto("memory.proto");
    const serviceDefinition = proto.Memory.service;

    const handlers = {};
    handlers.Append = this.handleAppend;
    handlers.GetWindow = this.handleGetWindow;

    return super.start(serviceDefinition, handlers);
  }

  /**
   * gRPC handler for `Append`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<memory.AppendResponse>} Typed response message.
   */
  async handleAppend(call) {
    const req = memory.AppendRequest.fromObject(call.request);
    return this.Append(req);
  }

  /**
   * gRPC handler for `GetWindow`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<memory.Window>} Typed response message.
   */
  async handleGetWindow(call) {
    const req = memory.WindowRequest.fromObject(call.request);
    return this.GetWindow(req);
  }

  /**
   * Implement the `Append` RPC.
   * @param { memory.AppendRequest } _req - Typed request message.
   * @returns {Promise<memory.AppendResponse>} Typed response message.
   */
  async Append(_req) {
    throw new Error("Not implemented");
  }

  /**
   * Implement the `GetWindow` RPC.
   * @param { memory.WindowRequest } _req - Typed request message.
   * @returns {Promise<memory.Window>} Typed response message.
   */
  async GetWindow(_req) {
    throw new Error("Not implemented");
  }
}
