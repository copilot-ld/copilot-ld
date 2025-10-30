/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { common, llm } from "@copilot-ld/libtype";
import { services } from "@copilot-ld/librpc";

const { LlmBase } = services;

/**
 * LLM service for completions and embeddings
 */
export class LlmService extends LlmBase {
  #llmFactory;

  /**
   * Creates a new LLM service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {(config: object) => import("@copilot-ld/libcopilot").Copilot} [llmFn] - Factory function to create LLM client
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory function
   */
  constructor(config, llmFn = createLlm, logFn) {
    super(config, logFn);
    this.#llmFactory = llmFn;
  }

  /** @inheritdoc */
  async CreateCompletions(req) {
    const copilot = this.#llmFactory(req.github_token, this.config.model);

    const completion = await copilot.createCompletions(
      req.messages,
      req.tools,
      req.temperature,
      undefined,
    );

    return llm.CompletionsResponse.fromObject(completion);
  }

  /** @inheritdoc */
  async CreateEmbeddings(req) {
    const copilot = this.#llmFactory(req.github_token, this.config.model);
    const data = await copilot.createEmbeddings(req.chunks);

    return {
      data: data.map((embedding) =>
        embedding instanceof common.Embedding
          ? embedding
          : new common.Embedding(embedding),
      ),
    };
  }
}
