/**
 * Base implementation for Llm gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class LlmBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  start(): Promise<number>;
  /**
   * gRPC handler for `CreateEmbeddings`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<llm.EmbeddingsResponse>} Typed response message.
   */
  handleCreateEmbeddings(call: object): Promise<llm.EmbeddingsResponse>;
  /**
   * gRPC handler for `CreateCompletions`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<llm.CompletionsResponse>} Typed response message.
   */
  handleCreateCompletions(call: object): Promise<llm.CompletionsResponse>;
  /**
   * Implement the `CreateEmbeddings` RPC.
   * @param { llm.EmbeddingsRequest } _req - Typed request message.
   * @returns {Promise<llm.EmbeddingsResponse>} Typed response message.
   */
  CreateEmbeddings(
    _req: llm.EmbeddingsRequest,
  ): Promise<llm.EmbeddingsResponse>;
  /**
   * Implement the `CreateCompletions` RPC.
   * @param { llm.CompletionsRequest } _req - Typed request message.
   * @returns {Promise<llm.CompletionsResponse>} Typed response message.
   */
  CreateCompletions(
    _req: llm.CompletionsRequest,
  ): Promise<llm.CompletionsResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { llm } from "@copilot-ld/libtype";
