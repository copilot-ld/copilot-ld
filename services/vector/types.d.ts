/**
 * Base class for Vector service with proto-specific method stubs
 * Extends the Service class for common gRPC functionality
 */
export class VectorBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers
   * @returns {Promise<number>} Port number the server is listening on
   */
  start(): Promise<number>;
  /**
   * Handler for QueryItems that creates typed data and calls the implementation
   * @param {object} call - gRPC call object
   * @returns {Promise<vector.QueryItemsResponse>} QueryItemsResponse
   */
  handleQueryItems(call: object): Promise<vector.QueryItemsResponse>;
  /**
   * QueryItems RPC method
   * @param { vector.QueryItemsRequest } req - Request message
   * @returns {Promise<vector.QueryItemsResponse>} Response message
   */
  QueryItems(req: vector.QueryItemsRequest): Promise<vector.QueryItemsResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { vector } from "@copilot-ld/libtype";
