/**
 * Base implementation for Tool gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class ToolBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  start(): Promise<number>;
  /**
   * gRPC handler for `ExecuteTool`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<tool.ToolCallResult>} Typed response message.
   */
  handleExecuteTool(call: object): Promise<tool.ToolCallResult>;
  /**
   * gRPC handler for `ListTools`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<tool.ListToolsResponse>} Typed response message.
   */
  handleListTools(call: object): Promise<tool.ListToolsResponse>;
  /**
   * Implement the `ExecuteTool` RPC.
   * @param { tool.Tool } _req - Typed request message.
   * @returns {Promise<tool.ToolCallResult>} Typed response message.
   */
  ExecuteTool(_req: tool.Tool): Promise<tool.ToolCallResult>;
  /**
   * Implement the `ListTools` RPC.
   * @param { tool.ListToolsRequest } _req - Typed request message.
   * @returns {Promise<tool.ListToolsResponse>} Typed response message.
   */
  ListTools(_req: tool.ListToolsRequest): Promise<tool.ListToolsResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { tool } from "@copilot-ld/libtype";
