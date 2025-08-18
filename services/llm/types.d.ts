/**
 * Base class for Llm service with proto-specific method stubs
 * Extends the Service class for common gRPC functionality
 */
export class LlmBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers
   * @returns {Promise<number>} Port number the server is listening on
   */
  start(): Promise<number>;
  /**
   * Handler for CreateEmbeddings that creates typed data and calls the implementation
   * @param {object} call - gRPC call object
   * @returns {Promise<llm.EmbeddingsResponse>} EmbeddingsResponse
   */
  handleCreateEmbeddings(call: object): Promise<llm.EmbeddingsResponse>;
  /**
   * Handler for CreateCompletions that creates typed data and calls the implementation
   * @param {object} call - gRPC call object
   * @returns {Promise<llm.CompletionsResponse>} CompletionsResponse
   */
  handleCreateCompletions(call: object): Promise<llm.CompletionsResponse>;
  /**
   * CreateEmbeddings RPC method
   * @param { llm.EmbeddingsRequest } req - Request message
   * @returns {Promise<llm.EmbeddingsResponse>} Response message
   */
  CreateEmbeddings(req: llm.EmbeddingsRequest): Promise<llm.EmbeddingsResponse>;
  /**
   * CreateCompletions RPC method
   * @param { llm.CompletionsRequest } req - Request message
   * @returns {Promise<llm.CompletionsResponse>} Response message
   */
  CreateCompletions(
    req: llm.CompletionsRequest,
  ): Promise<llm.CompletionsResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { llm } from "@copilot-ld/libtype";
