/**
 * Base implementation for Vector gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class VectorBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  start(): Promise<number>;
  /**
   * gRPC handler for `QueryItems`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<vector.QueryItemsResponse>} Typed response message.
   */
  handleQueryItems(call: object): Promise<vector.QueryItemsResponse>;
  /**
   * gRPC handler for `GetItem`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<vector.GetItemResponse>} Typed response message.
   */
  handleGetItem(call: object): Promise<vector.GetItemResponse>;
  /**
   * Implement the `QueryItems` RPC.
   * @param { vector.QueryItemsRequest } _req - Typed request message.
   * @returns {Promise<vector.QueryItemsResponse>} Typed response message.
   */
  QueryItems(
    _req: vector.QueryItemsRequest,
  ): Promise<vector.QueryItemsResponse>;
  /**
   * Implement the `GetItem` RPC.
   * @param { vector.GetItemRequest } _req - Typed request message.
   * @returns {Promise<vector.GetItemResponse>} Typed response message.
   */
  GetItem(_req: vector.GetItemRequest): Promise<vector.GetItemResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { vector } from "@copilot-ld/libtype";
