/* eslint-env node */
import { common } from "@copilot-ld/libtype";

import { LlmBase } from "../../generated/services/llm/service.js";

/**
 * LLM service for completions and embeddings
 */
class LlmService extends LlmBase {
  #llmFactory;

  /**
   * Creates a new LLM service instance
   * @param {object} config - Service configuration object
   * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - Factory function to create LLM instances
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, llmFactory, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    this.#llmFactory = llmFactory;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").llm.CompletionsRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").llm.CompletionsResponse>} Response message
   */
  async CreateCompletions(req) {
    const llm = this.#llmFactory(req.github_token, this.config.model);

    // Convert MessageV2 objects to simple message format for the LLM
    // TODO: This is not where fallbacks should be handled
    // TODO: We need better and more flexible rendering of representations
    const messages = req.messages.map((m) => ({
      role: m.role || "system",
      content: m.content ? String(m.content) : String(m.descriptor),
    }));

    // TODO: Again, we need more flexible rendering of representations
    const tools = req.tools?.map((t) => ({
      type: t.type,
      function: {
        name: String(t.function.id.name.split(".").pop()),
        description: String(t.function.descriptor),
        parameters: common.ToolParam.toObject(t.function.parameters) || {},
      },
    }));

    // Log completion details
    this.debug("Creating completion for messages", {
      messages: messages.length,
      tools: tools?.length || 0,
      temperature: req.temperature,
      model: this.config.model,
    });

    const params = {
      messages,
      tools,
      temperature: req.temperature,
    };

    const data = await llm.createCompletions(params);

    console.log("== FROM LLM SERVICE ==");
    console.log(JSON.stringify(data, null, 2));

    // Ensure all response data uses proper typed constructors
    return {
      id: data.id,
      object: data.object,
      created: data.created,
      model: data.model,
      choices: data.choices.map((choice) =>
        choice instanceof common.Choice
          ? choice
          : common.Choice.fromObject(choice),
      ),
      usage: data.usage
        ? data.usage instanceof common.Usage
          ? data.usage
          : common.Usage.fromObject(data.usage)
        : undefined,
    };
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").llm.EmbeddingsRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").llm.EmbeddingsResponse>} Response message
   */
  async CreateEmbeddings(req) {
    this.debug("Creating embeddings", {
      chunks: req.chunks?.length || 0,
    });

    const llm = this.#llmFactory(req.github_token, this.config.model);
    const data = await llm.createEmbeddings(req.chunks);

    // Ensure embedding data uses proper typed constructors
    return {
      data: data.map((embedding) =>
        embedding instanceof common.Embedding
          ? embedding
          : common.Embedding.fromObject(embedding),
      ),
    };
  }
}

export { LlmService };
export { LlmClient } from "../../generated/services/llm/client.js";
