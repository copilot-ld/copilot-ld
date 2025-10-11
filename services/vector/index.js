/* eslint-env node */
import { services } from "@copilot-ld/librpc";
import { vector, llm } from "@copilot-ld/libtype";

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
  constructor(config, contentIndex, descriptorIndex, llmClient, resourceIndex, logFn) {
    super(config, logFn);
    if (!llmClient) throw new Error("llmClient is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    
    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
    this.#llmClient = llmClient;
    this.#resourceIndex = resourceIndex;
  }

  /**
   * Query content index using text input
   * @param {vector.QueryByTextRequest} req - Text query request
   * @returns {Promise<vector.QueryByTextResponse>} Array of content strings
   */
  async QueryByContent(req) {
    return await this.#queryByText(req, "content");
  }

  /**
   * Query descriptor index using text input
   * @param {vector.QueryByTextRequest} req - Text query request
   * @returns {Promise<vector.QueryByTextResponse>} Array of descriptor strings
   */
  async QueryByDescriptor(req) {
    return await this.#queryByText(req, "descriptor");
  }

  /**
   * Shared implementation for text-based vector queries
   * @param {vector.QueryByTextRequest} req - Text query request
   * @param {string} indexType - Either "content" or "descriptor"
   * @returns {Promise<vector.QueryByTextResponse>} Array of content strings
   * @private
   */
  async #queryByText(req, indexType) {
    this.debug("Querying by text", {
      indexType,
      text: req.text?.substring(0, 100) + "...",
      threshold: req.filters?.threshold,
      limit: req.filters?.limit,
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
    const index = indexType === "descriptor" ? this.#descriptorIndex : this.#contentIndex;
    const vector = embeddings.data[0].embedding;
    
    const identifiers = await index.queryItems(vector, req.filters || {});

    this.debug("Vector query complete", {
      indexType,
      identifierCount: identifiers.length,
    });

    // 3. Get content strings from resource identifiers
    const contents = await this.#getContentsFromIdentifiers(identifiers, indexType);

    this.debug("Content retrieval complete", {
      indexType,
      contentCount: contents.length,
    });

    return { contents };
  }

  /**
   * Retrieves content strings from resource identifiers
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Resource identifiers
   * @param {string} indexType - Either "content" or "descriptor"
   * @returns {Promise<string[]>} Array of content strings
   * @private
   */
  async #getContentsFromIdentifiers(identifiers, indexType) {
    if (!identifiers?.length) {
      return [];
    }

    // Convert identifiers to strings for resource lookup
    const identifierStrings = identifiers.map(id => id.toString());
    
    // Use system actor for resource access
    const actor = "common.System.root";
    
    try {
      // Get resources from the index
      const resources = await this.#resourceIndex.get(actor, identifierStrings);
      
      // Extract content based on index type
      const contents = resources.map(resource => {
        if (indexType === "descriptor") {
          // For descriptors, return the descriptor content if available
          return resource.descriptor?.content?.toString() || resource.content?.toString() || "";
        } else {
          // For content, return the main content
          return resource.content?.toString() || "";
        }
      }).filter(content => content.length > 0);
      
      return contents;
    } catch (error) {
      this.debug("Error retrieving content from identifiers", {
        error: error.message,
        identifierCount: identifiers.length,
      });
      
      // Return empty array on error to avoid breaking the service
      return [];
    }
  }
}

// Export the service class (no bootstrap code here)
