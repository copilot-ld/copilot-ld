/* eslint-env node */
import { Message, Choice, Usage } from "@copilot-ld/libtype";
import { Service } from "@copilot-ld/libservice";

import { LlmServiceInterface } from "./types.js";

/**
 * LLM service for completions and embeddings
 * @implements {LlmServiceInterface}
 */
class LlmService extends Service {
  #llmFactory;

  /**
   * Creates a new LLM service instance
   * @param {object} config - Service configuration object
   * @param {Function} llmFactory - Factory function to create LLM instances
   * @param {Function} [grpcFn] - Optional gRPC factory function
   * @param {Function} [authFn] - Optional auth factory function
   */
  constructor(config, llmFactory, grpcFn, authFn) {
    super(config, grpcFn, authFn);
    this.#llmFactory = llmFactory;
  }

  /**
   * Creates completions using the LLM
   * @param {object} request - Request object containing completion parameters
   * @param {object[]} request.messages - Array of chat messages
   * @param {number} request.max_tokens - Maximum tokens to generate
   * @param {number} request.temperature - Sampling temperature
   * @param {number} request.top_p - Nucleus sampling parameter
   * @param {string} request.github_token - GitHub token for authentication
   * @returns {Promise<object>} Response containing completion data
   */
  async CreateCompletions(request) {
    const { messages, max_tokens, temperature, top_p, github_token } = request;

    const llm = this.#llmFactory(github_token, this.config.model);

    const params = {
      messages: messages.map((msg) => new Message(msg)),
      max_tokens,
      temperature,
      top_p,
    };

    const data = await llm.createCompletions(params);

    return {
      id: data.id,
      object: data.object,
      created: data.created,
      model: data.model,
      choices: data.choices.map((choice) => new Choice(choice)),
      usage: data.usage ? new Usage(data.usage) : undefined,
    };
  }

  /**
   * Creates embeddings for text chunks
   * @param {object} request - Request object containing embedding parameters
   * @param {string[]} request.chunks - Array of text chunks to embed
   * @param {string} request.github_token - GitHub token for authentication
   * @returns {Promise<object>} Response containing embedding data
   */
  async CreateEmbeddings({ chunks, github_token }) {
    const llm = this.#llmFactory(github_token, this.config.model);
    const data = await llm.createEmbeddings(chunks);
    return {
      data: data,
    };
  }
}

export { LlmService, LlmServiceInterface };
