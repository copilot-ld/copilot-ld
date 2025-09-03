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
  QueryItems(req: vector.QueryItemsRequest): Promise<vector.QueryItemsResponse>;
  /**
   * Call the `GetItem` RPC with request/response type conversion.
   * @param { vector.GetItemRequest } req - Typed request message.
   * @returns {Promise<vector.GetItemResponse>} Typed response message.
   */
  GetItem(req: vector.GetItemRequest): Promise<vector.GetItemResponse>;
}
import { Client } from "@copilot-ld/libservice";
import { vector } from "@copilot-ld/libtype";
