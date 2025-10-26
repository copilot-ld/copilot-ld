/* eslint-env node */
import { services } from "@copilot-ld/librpc";
import { llm } from "@copilot-ld/libtype";

const { VectorBase } = services;

/**
 * Vector search service for querying content and descriptor vector indexes
 */
export class VectorService extends VectorBase {
  #contentIndex;
  #descriptorIndex;
  #llmClient;
  #resourceIndex;

  /**
   * Creates a new Vector service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} contentIndex - Pre-initialized content vector index
   * @param {import("@copilot-ld/libvector").VectorIndexInterface} descriptorIndex - Pre-initialized descriptor vector index
   * @param {object} llmClient - LLM service client for embeddings
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for content retrieval
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(
    config,
    contentIndex,
    descriptorIndex,
    llmClient,
    resourceIndex,
    logFn,
  ) {
    super(config, logFn);
    if (!contentIndex) throw new Error("contentIndex is required");
    if (!descriptorIndex) throw new Error("descriptorIndex is required");
    if (!llmClient) throw new Error("llmClient is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
    this.#llmClient = llmClient;
    this.#resourceIndex = resourceIndex;
  }

  /**
   * Query content index using text input
   * @param {import("@copilot-ld/libtype").vector.TextQuery} req - Text query request
   * @returns {Promise<import("@copilot-ld/libtype").tool.QueryResults>} Query results with resource strings
   */
  async QueryByContent(req) {
    return await this.#queryByText(req, "content");
  }

  /**
   * Query descriptor index using text input
   * @param {import("@copilot-ld/libtype").vector.TextQuery} req - Text query request
   * @returns {Promise<import("@copilot-ld/libtype").tool.QueryResults>} Query results with resource strings
   */
  async QueryByDescriptor(req) {
    return await this.#queryByText(req, "descriptor");
  }

  /**
   * Shared implementation for text-based vector queries
   * @param {import("@copilot-ld/libtype").vector.TextQuery} req - Text query request
   * @param {string} type - Either "content" or "descriptor"
   * @returns {Promise<import("@copilot-ld/libtype").tool.QueryResults>} Query results with resource strings
   * @private
   */
  async #queryByText(req, type) {
    this.debug("Vector query", {
      type,
      text: req.text?.substring(0, 100) + "...",
      threshold: req.filter?.threshold,
      limit: req.filter?.limit,
      max_tokens: req.filter?.max_tokens,
    });

    // 1. Get embeddings from LLM service
    const embeddingRequest = llm.EmbeddingsRequest.fromObject({
      chunks: [req.text],
      github_token: req.github_token,
    });

    const embeddings = await this.#llmClient.CreateEmbeddings(embeddingRequest);

    if (!embeddings.data?.length) {
      throw new Error("No embeddings returned from LLM service");
    }

    // 2. Query appropriate vector index
    const index =
      type === "descriptor" ? this.#descriptorIndex : this.#contentIndex;
    const vector = embeddings.data[0].embedding;

    const identifiers = await index.queryItems(vector, req.filter);

    this.debug("Vector query results", {
      type,
      count: identifiers.length,
    });

    // 3. Get content strings from resource identifiers
    const results = await this.#getResources(identifiers, type);

    return { results };
  }

  /**
   * Retrieves resource strings from resource identifiers
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Resource identifiers
   * @param {string} type - Representation type, either "content" or "descriptor"
   * @returns {Promise<string[]>} Array of resource strings
   * @private
   */
  async #getResources(identifiers, type) {
    if (!identifiers?.length) {
      return [];
    }

    // Get resources from the index
    const actor = "common.System.root";
    const resources = await this.#resourceIndex.get(identifiers, actor);

    const contents = resources
      .map((resource) => {
        const representation =
          type === "descriptor" ? resource.descriptor : resource.content;
        return String(representation);
      })
      .filter((content) => content.length > 0);

    return contents;
  }
}
