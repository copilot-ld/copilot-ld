/* eslint-env node */

/** @typedef {import("@copilot-ld/libtype").ChunkIndexInterface} ChunkIndexInterface */
/** @typedef {import("@copilot-ld/libtype").LlmInterface} LlmInterface */
/** @typedef {import("@copilot-ld/libtype").StorageInterface} StorageInterface */
/** @typedef {import("@copilot-ld/libtype").VectorIndexInterface} VectorIndexInterface */

/**
 * VectorProcessor class for processing chunks into vector embeddings
 */
export class VectorProcessor {
  #vectorIndex;
  #chunkIndex;
  #client;
  #logger;

  /**
   * Creates a new VectorProcessor instance
   * @param {VectorIndexInterface} vectorIndex - The vector index to store embeddings
   * @param {ChunkIndexInterface} chunkIndex - ChunkIndex instance to process chunks from
   * @param {LlmInterface} client - LLM client instance for embedding generation
   * @param {object} logger - Logger instance for debug output
   */
  constructor(vectorIndex, chunkIndex, client, logger) {
    if (!vectorIndex) throw new Error("vectorIndex is required");
    if (!chunkIndex) throw new Error("chunkIndex is required");
    if (!client) throw new Error("client is required");
    if (!logger) throw new Error("logger is required");
    this.#vectorIndex = vectorIndex;
    this.#chunkIndex = chunkIndex;
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
   * Processes all chunks from all files by creating embeddings in batches
   * and adding them to the vector index.
   * Chunks are batched across multiple source files to optimize API calls.
   * @returns {Promise<void>}
   */
  async process() {
    const chunksObject = await this.#chunkIndex.getAllChunks();
    const chunkIds = Object.keys(chunksObject);

    this.#logger.debug("Starting to process chunks", {
      total: chunkIds.length,
    });

    // Pre-filter chunks that already exist in the vector index
    const existingChunks = new Set();
    const checks = await Promise.all(
      chunkIds.map(async (id) => ({
        id,
        exists: await this.#vectorIndex.hasItem(id),
      })),
    );
    checks
      .filter((check) => check.exists)
      .forEach((check) => existingChunks.add(check.id));

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
   * Processes a batch of chunks by generating embeddings and adding them to the vector index
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

    // Add all chunks to the vector index in parallel
    const addPromises = batch.map(async (chunk, i) => {
      const vector = embeddings[i].embedding;
      await this.#vectorIndex.addItem(
        chunk.id,
        vector,
        chunk.data.tokens,
        null, // No scope classification needed
      );
    });

    await Promise.all(addPromises);
  }
}
