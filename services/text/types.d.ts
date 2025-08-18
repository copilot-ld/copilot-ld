/**
 * Base class for Text service with proto-specific method stubs
 * Extends the Service class for common gRPC functionality
 */
export class TextBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers
   * @returns {Promise<number>} Port number the server is listening on
   */
  start(): Promise<number>;
  /**
   * Handler for GetChunks that creates typed data and calls the implementation
   * @param {object} call - gRPC call object
   * @returns {Promise<text.GetChunksResponse>} GetChunksResponse
   */
  handleGetChunks(call: object): Promise<text.GetChunksResponse>;
  /**
   * GetChunks RPC method
   * @param { text.GetChunksRequest } req - Request message
   * @returns {Promise<text.GetChunksResponse>} Response message
   */
  GetChunks(req: text.GetChunksRequest): Promise<text.GetChunksResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { text } from "@copilot-ld/libtype";
