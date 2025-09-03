/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { vector } from "@copilot-ld/libtype";

/**
 * Base implementation for Vector gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class VectorBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  async start() {
    const proto = await this.loadProto("vector.proto");
    const serviceDefinition = proto.Vector.service;

    const handlers = {};
    handlers.QueryItems = this.handleQueryItems;
    handlers.GetItem = this.handleGetItem;

    return super.start(serviceDefinition, handlers);
  }

  /**
   * gRPC handler for `QueryItems`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<vector.QueryItemsResponse>} Typed response message.
   */
  async handleQueryItems(call) {
    const req = vector.QueryItemsRequest.fromObject(call.request);
    return this.QueryItems(req);
  }

  /**
   * gRPC handler for `GetItem`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<vector.GetItemResponse>} Typed response message.
   */
  async handleGetItem(call) {
    const req = vector.GetItemRequest.fromObject(call.request);
    return this.GetItem(req);
  }

  /**
   * Implement the `QueryItems` RPC.
   * @param { vector.QueryItemsRequest } _req - Typed request message.
   * @returns {Promise<vector.QueryItemsResponse>} Typed response message.
   */
  async QueryItems(_req) {
    throw new Error("Not implemented");
  }

  /**
   * Implement the `GetItem` RPC.
   * @param { vector.GetItemRequest } _req - Typed request message.
   * @returns {Promise<vector.GetItemResponse>} Typed response message.
   */
  async GetItem(_req) {
    throw new Error("Not implemented");
  }
}
