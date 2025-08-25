/* eslint-env node */

/** @typedef {import("@copilot-ld/libresource").ResourceIndexInterface} ResourceIndexInterface */
/** @typedef {import("@copilot-ld/libtype").LlmInterface} LlmInterface */
/** @typedef {import("@copilot-ld/libtype").StorageInterface} StorageInterface */
/** @typedef {import("@copilot-ld/libtype").VectorIndexInterface} VectorIndexInterface */

/**
 * VectorProcessor class for processing resources into vector embeddings
 */
export class VectorProcessor {
  #vectorIndex;
  #resourceIndex;
  #client;
  #logger;

  /**
   * Creates a new VectorProcessor instance
   * @param {VectorIndexInterface} vectorIndex - The vector index to store embeddings
   * @param {ResourceIndexInterface} resourceIndex - ResourceIndex instance to process resources from
   * @param {LlmInterface} client - LLM client instance for embedding generation
   * @param {object} logger - Logger instance for debug output
   */
  constructor(vectorIndex, resourceIndex, client, logger) {
    if (!vectorIndex) throw new Error("vectorIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!client) throw new Error("client is required");
    if (!logger) throw new Error("logger is required");
    this.#vectorIndex = vectorIndex;
    this.#resourceIndex = resourceIndex;
    this.#client = client;
    this.#logger = logger;
  }

  /**
   * Persists the vector index to disk
   * @returns {Promise<void>}
   */
  async persist() {
    await this.#vectorIndex.persist();
    this.#logger.debug("Saved vectors to index");
  }

  /**
   * Processes all resources by creating embeddings in batches
   * and adding them to the vector index.
   * Resources are batched to optimize API calls.
   * @param {string} actor - Actor ID for resource access (URN format)
   * @returns {Promise<void>}
   */
  async process(actor) {
    const resources = await this.#resourceIndex.getAll(actor);

    this.#logger.debug("Starting to process resources", {
      total: resources.length,
    });

    // Pre-filter resources that already exist in the vector index
    const existingResources = new Set();
    const checks = await Promise.all(
      resources.map(async (resource) => ({
        id: resource.meta.id,
        exists: await this.#vectorIndex.hasItem(resource.meta.id),
      })),
    );
    checks
      .filter((check) => check.exists)
      .forEach((check) => existingResources.add(check.id));

    // Process resources in batches to optimize API calls
    const batchTokenLimit = 4000;
    let currentBatch = [];
    let currentTokenCount = 0;
    let processedCount = 0;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      
      // Determine content to embed based on resource type
      let contentToEmbed;
      if (resource.meta.type === "common.MessageV2") {
        contentToEmbed = resource.content;
      } else {
        contentToEmbed = resource.meta.toDescription();
      }

      if (!contentToEmbed) {
        this.#logger.debug("Skipping, no content found", { 
          resourceId: resource.meta.id,
          type: resource.meta.type 
        });
        continue;
      }

      // Skip if already exists (now O(1) lookup)
      if (existingResources.has(resource.meta.id)) {
        this.#logger.debug("Skipping, already exists", { resourceId: resource.meta.id });
        continue;
      }

      // Estimate token count (rough approximation: 1 token ≈ 4 characters)
      const estimatedTokens = Math.ceil(contentToEmbed.length / 4);

      // If adding this resource would exceed the batch limit and we have resources in the batch, process the current batch
      if (
        currentTokenCount + estimatedTokens > batchTokenLimit &&
        currentBatch.length > 0
      ) {
        await this.#processBatch(currentBatch, processedCount, resources.length);
        processedCount += currentBatch.length;
        currentBatch = [];
        currentTokenCount = 0;
      }

      // Add resource to current batch
      currentBatch.push({
        id: resource.meta.id,
        text: contentToEmbed,
        meta: resource.meta.withoutDescription(),
        tokens: estimatedTokens,
      });
      currentTokenCount += estimatedTokens;
    }

    // Process any remaining resources in the final batch
    if (currentBatch.length > 0) {
      await this.#processBatch(currentBatch, processedCount, resources.length);
    }
  }

  /**
   * Processes a batch of resources by generating embeddings and adding them to the vector index
   * @param {Array<{id: string, text: string, meta: object, tokens: number}>} batch - Array of resource objects to process
   * @param {number} processed - Number of resources already processed
   * @param {number} total - Total number of resources to process
   * @returns {Promise<void>}
   */
  async #processBatch(batch, processed, total) {
    const batchSize = batch.length;
    const tokens = batch.reduce((sum, resource) => sum + resource.tokens, 0);

    this.#logger.debug("Processing", {
      resource:
        batchSize > 1
          ? `${processed + 1}-${processed + batchSize}/${total}`
          : `${processed + 1}/${total}`,
      tokens,
    });

    // Generate embeddings for all resources in the batch
    const resourceTexts = batch.map((resource) => resource.text);
    const embeddings = await this.#client.createEmbeddings(resourceTexts);

    // Add all resources to the vector index in parallel
    const addPromises = batch.map(async (resource, i) => {
      const vector = embeddings[i].embedding;
      await this.#vectorIndex.addItem(
        resource.id,
        {
          vector,
          meta: resource.meta,
        },
        resource.tokens,
        null, // No scope classification needed
      );
    });

    await Promise.all(addPromises);
  }
}
