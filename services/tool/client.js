/* eslint-env node */
import { Client } from "@copilot-ld/libservice";
import { tool } from "@copilot-ld/libtype";

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
  async ExecuteTool(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("ExecuteTool", request);
    return tool.ToolCallResult.fromObject(response);
  }

  /**
   * Call the `ListTools` RPC with request/response type conversion.
   * @param { tool.ListToolsRequest } req - Typed request message.
   * @returns {Promise<tool.ListToolsResponse>} Typed response message.
   */
  async ListTools(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("ListTools", request);
    return tool.ListToolsResponse.fromObject(response);
  }
}
