/* eslint-env node */

/** @typedef {import("@copilot-ld/libresource").ResourceIndexInterface} ResourceIndexInterface */
/** @typedef {import("@copilot-ld/libcopilot").LlmInterface} LlmInterface */
/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */
/** @typedef {import("@copilot-ld/libvector").VectorIndexInterface} VectorIndexInterface */
/** @typedef {import("@copilot-ld/libtype").resource.Descriptor} resource.Descriptor */

/**
 * VectorProcessor class for processing resources into vector embeddings
 */
export class VectorProcessor {
  #contentIndex;
  #descriptorIndex;
  #resourceIndex;
  #llm;
  #logger;

  /**
   * Creates a new VectorProcessor instance
   * @param {VectorIndexInterface} contentIndex - The vector index to store content embeddings
   * @param {VectorIndexInterface} descriptorIndex - The vector index to store descriptor embeddings
   * @param {ResourceIndexInterface} resourceIndex - ResourceIndex instance to process resources from
   * @param {LlmInterface} llm - LLM client instance for embedding generation
   * @param {object} logger - Logger instance for debug output
   */
  constructor(contentIndex, descriptorIndex, resourceIndex, llm, logger) {
    if (!contentIndex) throw new Error("contentIndex is required");
    if (!descriptorIndex) throw new Error("descriptorIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!llm) throw new Error("llm is required");
    if (!logger) throw new Error("logger is required");
    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
    this.#resourceIndex = resourceIndex;
    this.#llm = llm;
    this.#logger = logger;
  }

  /**
   * Process resources from the resource index for vector embeddings
   * @param {string} actor - Actor identifier for access control
   * @param {string} representation - What representation of resources to process (descriptor or content)
   * @returns {Promise<void>}
   */
  async process(actor, representation = "content") {
    const identifiers = await this.#resourceIndex.findAll();

    // Load the full resources using the identifiers
    const resources = await this.#resourceIndex.get(actor, identifiers);

    // Select the appropriate vector index based on representation
    const targetIndex =
      representation === "descriptor"
        ? this.#descriptorIndex
        : this.#contentIndex;

    this.#logger.debug("Starting process", {
      total: resources.length,
      representation,
    });

    // Pre-filter resource contents that already exist in the target vector index
    const existing = new Set();
    const checks = await Promise.all(
      resources.map(async (resource) => ({
        id: resource.id,
        exists: await targetIndex.hasItem(resource.id),
      })),
    );
    checks
      .filter((check) => check.exists)
      .forEach((check) => existing.add(check.id));

    // Process resource contents in batches
    let currentBatch = [];
    let processedCount = 0;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];

      // Determine content to embed based on resource content type
      let text;
      switch (representation) {
        case "content":
          text = String(resource.content);
          break;

        case "descriptor":
          text = String(resource.descriptor);
      }

      if (text === null || text === "null" || text.trim() === "") {
        this.#logger.debug("Skipping, no text", {
          id: resource.id,
          representation,
        });
        continue;
      }

      // Skip if already exists (now O(1) lookup)
      if (existing.has(resource.id)) {
        this.#logger.debug("Skipping, already exists", {
          id: resource.id,
          representation,
        });
        continue;
      }

      // Add resource content to current batch
      currentBatch.push({
        text: text,
        identifier: resource.id,
      });

      // Process batch when it reaches a reasonable size
      if (currentBatch.length >= 10) {
        await this.#processBatch(
          currentBatch,
          processedCount,
          resources.length,
          targetIndex,
          representation,
        );
        processedCount += currentBatch.length;
        currentBatch = [];
      }
    }

    // Process any remaining resource contents in the final batch
    if (currentBatch.length > 0) {
      await this.#processBatch(
        currentBatch,
        processedCount,
        resources.length,
        targetIndex,
        representation,
      );
    }
  }

  /**
   * Processes a batch of resource contents by generating embeddings and adding them to the vector index
   * @param {Array<{text: string, identifier: object}>} batch - Array of resource content objects to process
   * @param {number} processed - Number of resource contents already processed
   * @param {number} total - Total number of resource contents to process
   * @param {VectorIndexInterface} targetIndex - The vector index to add embeddings to (content or descriptor index)
   * @param {string} representation - The representation being processed (content or descriptor)
   * @returns {Promise<void>}
   */
  async #processBatch(batch, processed, total, targetIndex, representation) {
    const batchSize = batch.length;

    this.#logger.debug("Processing", {
      resource:
        batchSize > 1
          ? `${processed + 1}-${processed + batchSize}/${total}`
          : `${processed + 1}/${total}`,
      representation,
    });

    // Generate embeddings for all resource contents in the batch
    const texts = batch.map((data) => data.text);
    const embeddings = await this.#llm.createEmbeddings(texts);

    // Add all items to the target vector index in parallel
    const promises = batch.map(async (data, i) => {
      const vector = embeddings[i].embedding;
      const identifier = data.identifier;
      await targetIndex.addItem(vector, identifier);
    });

    await Promise.all(promises);
  }
}
