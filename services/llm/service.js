/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { llm } from "@copilot-ld/libtype";

/**
 * Base implementation for Llm gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class LlmBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  async start() {
    const proto = await this.loadProto("llm.proto");
    const serviceDefinition = proto.Llm.service;

    const handlers = {};
    handlers.CreateEmbeddings = this.handleCreateEmbeddings;
    handlers.CreateCompletions = this.handleCreateCompletions;

    return super.start(serviceDefinition, handlers);
  }

  /**
   * gRPC handler for `CreateEmbeddings`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<llm.EmbeddingsResponse>} Typed response message.
   */
  async handleCreateEmbeddings(call) {
    const req = llm.EmbeddingsRequest.fromObject(call.request);
    return this.CreateEmbeddings(req);
  }

  /**
   * gRPC handler for `CreateCompletions`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<llm.CompletionsResponse>} Typed response message.
   */
  async handleCreateCompletions(call) {
    const req = llm.CompletionsRequest.fromObject(call.request);
    return this.CreateCompletions(req);
  }

  /**
   * Implement the `CreateEmbeddings` RPC.
   * @param { llm.EmbeddingsRequest } _req - Typed request message.
   * @returns {Promise<llm.EmbeddingsResponse>} Typed response message.
   */
  async CreateEmbeddings(_req) {
    throw new Error("Not implemented");
  }

  /**
   * Implement the `CreateCompletions` RPC.
   * @param { llm.CompletionsRequest } _req - Typed request message.
   * @returns {Promise<llm.CompletionsResponse>} Typed response message.
   */
  async CreateCompletions(_req) {
    throw new Error("Not implemented");
  }
}
