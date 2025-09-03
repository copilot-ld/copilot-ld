/**
 * Typed client for the Tool gRPC service with automatic type conversion.
 * Extends the `Client` class for shared gRPC client functionality.
 */
export class ToolClient extends Client {
  /**
   * Call the `ExecuteTool` RPC with request/response type conversion.
   * @param { tool.Tool } req - Typed request message.
   * @returns {Promise<tool.ToolCallResult>} Typed response message.
   */
  ExecuteTool(req: tool.Tool): Promise<tool.ToolCallResult>;
  /**
   * Call the `ListTools` RPC with request/response type conversion.
   * @param { tool.ListToolsRequest } req - Typed request message.
   * @returns {Promise<tool.ListToolsResponse>} Typed response message.
   */
  ListTools(req: tool.ListToolsRequest): Promise<tool.ListToolsResponse>;
}
import { Client } from "@copilot-ld/libservice";
import { tool } from "@copilot-ld/libtype";
