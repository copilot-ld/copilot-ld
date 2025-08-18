/**
 * Base class for History service with proto-specific method stubs
 * Extends the Service class for common gRPC functionality
 */
export class HistoryBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers
   * @returns {Promise<number>} Port number the server is listening on
   */
  start(): Promise<number>;
  /**
   * Handler for GetHistory that creates typed data and calls the implementation
   * @param {object} call - gRPC call object
   * @returns {Promise<history.GetHistoryResponse>} GetHistoryResponse
   */
  handleGetHistory(call: object): Promise<history.GetHistoryResponse>;
  /**
   * Handler for UpdateHistory that creates typed data and calls the implementation
   * @param {object} call - gRPC call object
   * @returns {Promise<history.UpdateHistoryResponse>} UpdateHistoryResponse
   */
  handleUpdateHistory(call: object): Promise<history.UpdateHistoryResponse>;
  /**
   * GetHistory RPC method
   * @param { history.GetHistoryRequest } req - Request message
   * @returns {Promise<history.GetHistoryResponse>} Response message
   */
  GetHistory(
    req: history.GetHistoryRequest,
  ): Promise<history.GetHistoryResponse>;
  /**
   * UpdateHistory RPC method
   * @param { history.UpdateHistoryRequest } req - Request message
   * @returns {Promise<history.UpdateHistoryResponse>} Response message
   */
  UpdateHistory(
    req: history.UpdateHistoryRequest,
  ): Promise<history.UpdateHistoryResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { history } from "@copilot-ld/libtype";
