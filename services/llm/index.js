/* eslint-env node */
import { common, llm } from "@copilot-ld/libtype";

import { LlmBase } from "../../generated/services/llm/service.js";

/**
 * LLM service for completions and embeddings
 */
export class LlmService extends LlmBase {
  #llmFactory;

  /**
   * Creates a new LLM service instance
   * @param {object} config - Service configuration object
   * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - Factory function to create LLM instances
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, llmFactory, logFn) {
    super(config, logFn);
    this.#llmFactory = llmFactory;
  }

  /** @inheritdoc */
  async CreateCompletions(req) {
    const copilot = this.#llmFactory(req.github_token, this.config.model);

    this.debug("Creating completion", {
      messages: req.messages.length,
      tools: req.tools?.length || 0,
      temperature: req.temperature,
      model: this.config.model,
    });

    const completion = await copilot.createCompletions(
      req.messages,
      req.tools,
      req.temperature,
      undefined, // max_tokens - use default
    );

    return llm.CompletionsResponse.fromObject(completion);
  }

  /** @inheritdoc */
  async CreateEmbeddings(req) {
    const copilot = this.#llmFactory(req.github_token, this.config.model);
    const data = await copilot.createEmbeddings(req.chunks);

    // Ensure embedding data uses proper typed constructors
    return {
      data: data.map((embedding) =>
        embedding instanceof common.Embedding
          ? embedding
          : new common.Embedding(embedding),
      ),
    };
  }
}

// Export the service class (no bootstrap code here)
