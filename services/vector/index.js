/* eslint-env node */
import { services } from "@copilot-ld/librpc";
import { llm } from "@copilot-ld/libtype";

const { VectorBase } = services;

/**
 * Vector search service for querying content vector index
 */
export class VectorService extends VectorBase {
  #vectorIndex;
  #llmClient;

  /**
   * Creates a new Vector service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} vectorIndex - Pre-initialized vector index
   * @param {object} llmClient - LLM service client for embeddings
   * @param {Function} logFn - Optional logging function
   */
  constructor(config, vectorIndex, llmClient, logFn) {
    super(config, logFn);
    if (!vectorIndex) throw new Error("vectorIndex is required");
    if (!llmClient) throw new Error("llmClient is required");

    this.#vectorIndex = vectorIndex;
    this.#llmClient = llmClient;
  }

  /**
   * Search content index using text input
   * @param {import("@copilot-ld/libtype").vector.TextQuery} req - Text query request
   * @returns {Promise<import("@copilot-ld/libtype").tool.ToolCallResult>} Query results with resource identifiers
   */
  async SearchContent(req) {
    // 1. Get embeddings from LLM service
    const embeddingRequest = llm.EmbeddingsRequest.fromObject({
      chunks: [req.text],
      github_token: req.github_token,
    });

    const embeddings = await this.#llmClient.CreateEmbeddings(embeddingRequest);

    if (!embeddings.data?.length) {
      throw new Error("No embeddings returned from LLM service");
    }

    // 2. Query content vector index
    const vector = embeddings.data[0].embedding;

    // 3. Retrieve identifiers
    const identifiers = await this.#vectorIndex.queryItems(vector, req.filter);
    return { identifiers };
  }
}
