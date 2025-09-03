/**
 * Typed client for the Llm gRPC service with automatic type conversion.
 * Extends the `Client` class for shared gRPC client functionality.
 */
export class LlmClient extends Client {
  /**
   * Call the `CreateEmbeddings` RPC with request/response type conversion.
   * @param { llm.EmbeddingsRequest } req - Typed request message.
   * @returns {Promise<llm.EmbeddingsResponse>} Typed response message.
   */
  CreateEmbeddings(req: llm.EmbeddingsRequest): Promise<llm.EmbeddingsResponse>;
  /**
   * Call the `CreateCompletions` RPC with request/response type conversion.
   * @param { llm.CompletionsRequest } req - Typed request message.
   * @returns {Promise<llm.CompletionsResponse>} Typed response message.
   */
  CreateCompletions(
    req: llm.CompletionsRequest,
  ): Promise<llm.CompletionsResponse>;
}
import { Client } from "@copilot-ld/libservice";
import { llm } from "@copilot-ld/libtype";
