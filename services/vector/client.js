/* eslint-env node */
import { Client } from "@copilot-ld/libservice";
import { vector } from "@copilot-ld/libtype";

/**
 * Typed client for the Vector gRPC service with automatic type conversion.
 * Extends the `Client` class for shared gRPC client functionality.
 */
export class VectorClient extends Client {
  /**
   * Call the `QueryItems` RPC with request/response type conversion.
   * @param { vector.QueryItemsRequest } req - Typed request message.
   * @returns {Promise<vector.QueryItemsResponse>} Typed response message.
   */
  async QueryItems(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("QueryItems", request);
    return vector.QueryItemsResponse.fromObject(response);
  }

  /**
   * Call the `GetItem` RPC with request/response type conversion.
   * @param { vector.GetItemRequest } req - Typed request message.
   * @returns {Promise<vector.GetItemResponse>} Typed response message.
   */
  async GetItem(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("GetItem", request);
    return vector.GetItemResponse.fromObject(response);
  }
}
