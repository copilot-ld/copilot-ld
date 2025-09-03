/* eslint-env node */
import { Client } from "@copilot-ld/libservice";
import { llm } from "@copilot-ld/libtype";

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
  async CreateEmbeddings(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("CreateEmbeddings", request);
    return llm.EmbeddingsResponse.fromObject(response);
  }

  /**
   * Call the `CreateCompletions` RPC with request/response type conversion.
   * @param { llm.CompletionsRequest } req - Typed request message.
   * @returns {Promise<llm.CompletionsResponse>} Typed response message.
   */
  async CreateCompletions(req) {
    const request = req.toObject ? req.toObject() : req;
    const response = await this.callMethod("CreateCompletions", request);
    return llm.CompletionsResponse.fromObject(response);
  }
}
