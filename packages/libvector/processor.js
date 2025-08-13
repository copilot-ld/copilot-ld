/* eslint-env node */
import { resolveScope } from "@copilot-ld/libscope";

/** @typedef {import("@copilot-ld/libtype").ChunkIndexInterface} ChunkIndexInterface */
/** @typedef {import("@copilot-ld/libtype").LlmInterface} LlmInterface */
/** @typedef {import("@copilot-ld/libtype").StorageInterface} StorageInterface */
/** @typedef {import("@copilot-ld/libtype").VectorIndexInterface} VectorIndexInterface */

/**
 * VectorProcessor class for processing chunks into vector embeddings and classifications
 */
export class VectorProcessor {
  #scopeIndex;
  #vectorIndices;
  #chunkIndex;
  #client;
  #logger;

  /**
   * Creates a new VectorProcessor instance
   * @param {VectorIndexInterface} scopeIndex - The scope classification index
   * @param {{[key: string]: VectorIndexInterface}} vectorIndices - Object containing vector indices for each scope
   * @param {ChunkIndexInterface} chunkIndex - ChunkIndex instance to process chunks from
   * @param {LlmInterface} client - LLM client instance for embedding generation
   * @param {object} logger - Logger instance for debug output
   */
  constructor(scopeIndex, vectorIndices, chunkIndex, client, logger) {
    if (!logger) throw new Error("logger is required");
    this.#scopeIndex = scopeIndex;
    this.#vectorIndices = vectorIndices;
    this.#chunkIndex = chunkIndex;
    this.#client = client;
    this.#logger = logger;
  }

  /**
   * Trains the scope classification index by generating embeddings
   * for training data and building a vector index for scope classification
   * @param {{[key: string]: string[]}} trainingData - Object with scope names as keys and arrays of training texts as values
   * @returns {Promise<void>}
   */
  async train(trainingData) {
    // Ensure all vector indices exist first.
    await this.#scopeIndex.persist();
    for (const [_scope, vectorIndex] of Object.entries(this.#vectorIndices)) {
      await vectorIndex.persist();
    }

    for (const [scope, trainingTexts] of Object.entries(trainingData)) {
      this.#logger.debug("Adding training data", { scope });

      const embeddings = await this.#client.createEmbeddings(trainingTexts);

      for (let i = 0; i < trainingTexts.length; i++) {
        const id = `${scope}#${i}`;
        const vector = embeddings[i].embedding;
        const tokenCount = trainingTexts[i].split(" ").length;
        await this.#scopeIndex.addItem(id, vector, tokenCount, scope);
      }
    }

    await this.#scopeIndex.persist();
  }

  /**
   * Persists all vector indices to disk
   * @returns {Promise<void>}
   */
  async persist() {
    for (const [scope, vectorIndex] of Object.entries(this.#vectorIndices)) {
      await vectorIndex.persist();
      this.#logger.debug("Saved vectors", { scope });
    }
  }

  /**
   * Processes all chunks from all files by creating embeddings in batches,
   * classifying their scope, and adding them to appropriate scope-specific vector indices.
   * Chunks are batched across multiple source files to optimize API calls.
   * @returns {Promise<void>}
   */
  async process() {
    const chunksObject = await this.#chunkIndex.getAllChunks();
    const chunkIds = Object.keys(chunksObject);

    this.#logger.debug("Starting to process chunks", {
      total: chunkIds.length,
    });

    // Pre-filter chunks that already exist in any vector index
    const existingChunks = new Set();
    const existenceChecks = Object.values(this.#vectorIndices).map(
      async (vectorIndex) => {
        const checks = await Promise.all(
          chunkIds.map(async (id) => ({
            id,
            exists: await vectorIndex.hasItem(id),
          })),
        );
        checks
          .filter((check) => check.exists)
          .forEach((check) => existingChunks.add(check.id));
      },
    );

    await Promise.all(existenceChecks);

    // Process chunks in batches to optimize API calls
    const batchTokenLimit = 4000;
    let currentBatch = [];
    let currentTokenCount = 0;
    let processedCount = 0;

    for (let i = 0; i < chunkIds.length; i++) {
      const chunkId = chunkIds[i];
      const chunkData = chunksObject[chunkId];
      const chunkText = chunkData?.text;

      if (!chunkText) {
        this.#logger.debug("Skipping, no text found", { chunkId });
        continue;
      }

      // Skip if already exists (now O(1) lookup)
      if (existingChunks.has(chunkId)) {
        this.#logger.debug("Skipping, already exists", { chunkId });
        continue;
      }

      const chunkTokens = chunkData.tokens;

      // If adding this chunk would exceed the batch limit and we have chunks in the batch, process the current batch
      if (
        currentTokenCount + chunkTokens > batchTokenLimit &&
        currentBatch.length > 0
      ) {
        await this.#processBatch(currentBatch, processedCount, chunkIds.length);
        processedCount += currentBatch.length;
        currentBatch = [];
        currentTokenCount = 0;
      }

      // Add chunk to current batch
      currentBatch.push({
        id: chunkId,
        text: chunkText,
        data: chunkData,
      });
      currentTokenCount += chunkTokens;
    }

    // Process any remaining chunks in the final batch
    if (currentBatch.length > 0) {
      await this.#processBatch(currentBatch, processedCount, chunkIds.length);
    }
  }

  /**
   * Processes a batch of chunks by generating embeddings and classifying their scope
   * @param {Array<{id: string, text: string, data: object}>} batch - Array of chunk objects to process
   * @param {number} processed - Number of chunks already processed
   * @param {number} total - Total number of chunks to process
   * @returns {Promise<void>}
   */
  async #processBatch(batch, processed, total) {
    const batchSize = batch.length;
    const tokens = batch.reduce((sum, chunk) => sum + chunk.data.tokens, 0);

    this.#logger.debug("Processing", {
      chunk:
        batchSize > 1
          ? `${processed + 1}-${processed + batchSize}/${total}`
          : `${processed + 1}/${total}`,
      tokens,
    });

    // Generate embeddings for all chunks in the batch
    const chunkTexts = batch.map((chunk) => chunk.text);
    const embeddings = await this.#client.createEmbeddings(chunkTexts);

    // Group chunks by scope and process in parallel
    const scopeGroups = {};

    for (let i = 0; i < batch.length; i++) {
      const chunk = batch[i];
      const vector = embeddings[i].embedding;
      const scopes = await resolveScope(vector, this.#scopeIndex);
      const scope = scopes[0];

      if (!scopeGroups[scope]) {
        scopeGroups[scope] = [];
      }

      scopeGroups[scope].push({
        id: chunk.id,
        vector,
        tokens: chunk.data.tokens,
        scope,
      });
    }

    // Add items to each scope's vector index in parallel
    const addPromises = Object.entries(scopeGroups).map(
      async ([scope, items]) => {
        const vectorIndex = this.#vectorIndices[scope];

        await Promise.all(
          items.map((item) =>
            vectorIndex.addItem(item.id, item.vector, item.tokens, item.scope),
          ),
        );
      },
    );

    await Promise.all(addPromises);
  }
}
