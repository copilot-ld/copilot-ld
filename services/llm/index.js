import { createLlmApi } from "@copilot-ld/libllm";
import { memory } from "@copilot-ld/libtype";
import { services } from "@copilot-ld/librpc";

const { LlmBase } = services;

/**
 * LLM service for completions and embeddings
 */
export class LlmService extends LlmBase {
  #llmFactory;
  #memoryClient;

  /**
   * Creates a new LLM service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {object} memoryClient - Memory service client for fetching windows
   * @param {(token: string, model: string, baseUrl: string) => import("@copilot-ld/libllm").LlmApi} [llmFn] - Factory function to create LLM client
   */
  constructor(config, memoryClient, llmFn = createLlmApi) {
    super(config);
    this.#llmFactory = llmFn;
    this.#memoryClient = memoryClient;
  }

  /** @inheritdoc */
  async CreateCompletions(req) {
    if (!req.resource_id)
      throw new Error("resource_id is required for CreateCompletions");

    const model = req.model || this.config.model;
    const baseUrl = this.config.llmBaseUrl();
    const llm = this.#llmFactory(req.llm_token, model, baseUrl);

    const windowRequest = memory.WindowRequest.fromObject({
      resource_id: req.resource_id,
      model,
    });

    const window = await this.#memoryClient.GetWindow(windowRequest);
    return await llm.createCompletions(window);
  }

  /** @inheritdoc */
  async CreateEmbeddings(req) {
    if (!req.input || req.input.length === 0)
      throw new Error("input is required for CreateEmbeddings");

    const model = req.model || this.config.model;
    const baseUrl = this.config.llmBaseUrl();
    const llm = this.#llmFactory(req.llm_token, model, baseUrl);

    return await llm.createEmbeddings(req.input);
  }
}
