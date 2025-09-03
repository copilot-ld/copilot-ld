/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { tool } from "@copilot-ld/libtype";

/**
 * Base implementation for Tool gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class ToolBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  async start() {
    const proto = await this.loadProto("tool.proto");
    const serviceDefinition = proto.Tool.service;

    const handlers = {};
    handlers.ExecuteTool = this.handleExecuteTool;
    handlers.ListTools = this.handleListTools;

    return super.start(serviceDefinition, handlers);
  }

  /**
   * gRPC handler for `ExecuteTool`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<tool.ToolCallResult>} Typed response message.
   */
  async handleExecuteTool(call) {
    const req = tool.Tool.fromObject(call.request);
    return this.ExecuteTool(req);
  }

  /**
   * gRPC handler for `ListTools`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<tool.ListToolsResponse>} Typed response message.
   */
  async handleListTools(call) {
    const req = tool.ListToolsRequest.fromObject(call.request);
    return this.ListTools(req);
  }

  /**
   * Implement the `ExecuteTool` RPC.
   * @param { tool.Tool } _req - Typed request message.
   * @returns {Promise<tool.ToolCallResult>} Typed response message.
   */
  async ExecuteTool(_req) {
    throw new Error("Not implemented");
  }

  /**
   * Implement the `ListTools` RPC.
   * @param { tool.ListToolsRequest } _req - Typed request message.
   * @returns {Promise<tool.ListToolsResponse>} Typed response message.
   */
  async ListTools(_req) {
    throw new Error("Not implemented");
  }
}
