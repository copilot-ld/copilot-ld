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
   * Creates LLM completions using a prompt
   * @param {object} request - Request containing prompt and parameters
   * @param {object} request.prompt - Prompt object with conversation and context
   * @param {number} request.temperature - Sampling temperature
   * @param {string} request.github_token - GitHub token for authentication
   * @returns {Promise<object>} Response containing completion data
   */
  async CreateCompletions(request) {
    const { prompt, temperature, github_token } = request;

    const llm = this.#llmFactory(github_token, this.config.model);

    console.log(JSON.stringify(request));
    // Ensure prompt is a proper Prompt instance (reconstruct if needed due to gRPC serialization)
    let promptInstance;
    if (typeof prompt.toMessages === "function") {
      promptInstance = prompt;
    } else {
      // Reconstruct Prompt instance from plain object (gRPC deserialization)
      const { Prompt } = await import("@copilot-ld/libprompt");
      promptInstance = new Prompt(prompt);
    }

    // Convert prompt to messages using the built-in method
    const messages = promptInstance.toMessages();
    const params = {
      messages: messages.map((msg) => new Message(msg)),
      temperature,
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
