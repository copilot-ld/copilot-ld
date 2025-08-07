/* eslint-env node */
import { test, describe } from "node:test";

import { ChunkIndex } from "../index.js";
import { createPerformanceTest } from "../../libperf/index.js";

describe("LibChunk Performance Tests", () => {
  /**
   * Generate mock chunk data for testing
   * @param {number} count - Number of chunks to generate
   * @param {number} textSize - Size of text content in KB
   * @returns {object} Mock index and storage data
   */
  function generateMockChunks(count, textSize) {
    const indexData = {};
    const chunkTexts = {};

    for (let i = 0; i < count; i++) {
      const chunkId = `chunk-${i.toString().padStart(6, "0")}`;
      indexData[chunkId] = {
        id: chunkId,
        tokens: Math.floor((textSize * 1024) / 4), // Rough token estimate (4 bytes per token)
        scope: `scope-${i % 100}`,
        metadata: `metadata-${i}`,
      };

      // Generate text content of specified size in KB
      const targetBytes = textSize * 1024; // Convert KB to bytes
      const text = `Content for chunk ${i} `.repeat(
        Math.ceil(targetBytes / `Content for chunk ${i} `.length),
      );
      chunkTexts[`${chunkId}/chunk.json`] = text.slice(0, targetBytes);
    }

    return { indexData, chunkTexts };
  }

  /**
   * Create mock storage with generated chunk data
   * @param {number} chunkCount - Number of chunks to generate
   * @param {number} textSize - Size of text content in KB
   * @returns {object} Mock storage and test data
   */
  function createDependencies(chunkCount, textSize = 1) {
    const { indexData, chunkTexts } = generateMockChunks(chunkCount, textSize);

    const mockStorage = {
      get: (key) => {
        if (key === "index.json") {
          return Promise.resolve(Buffer.from(JSON.stringify(indexData)));
        }
        if (chunkTexts[key]) {
          return Promise.resolve(Buffer.from(chunkTexts[key]));
        }
        return Promise.resolve(Buffer.from(""));
      },
      exists: (key) => {
        if (key === "index.json") return Promise.resolve(true);
        return Promise.resolve(!!chunkTexts[key]);
      },
      put: () => Promise.resolve(),
    };

    return { mockStorage };
  }

  test(
    "ChunkIndex.loadData by chunk",
    createPerformanceTest({
      count: [100, 500, 1000, 2000],
      setupFn: (chunkCount) => createDependencies(chunkCount, 1),
      testFn: ({ mockStorage }) => {
        const index = new ChunkIndex(mockStorage);
        return index.loadData();
      },
      constraints: {
        maxDuration: 30,
        maxMemory: 8200,
        scaling: "linear",
        tolerance: 5.0,
      },
    }),
  );

  test(
    "ChunkIndex.loadData by text size",
    createPerformanceTest({
      count: [1, 2, 4, 8],
      setupFn: (textSize) => createDependencies(1000, textSize),
      testFn: ({ mockStorage }) => {
        const index = new ChunkIndex(mockStorage);
        return index.loadData();
      },
      constraints: {
        maxDuration: 18,
        maxMemory: 14000,
        scaling: "linear",
        tolerance: 1.5,
      },
    }),
  );

  test(
    "ChunkIndex.getChunks",
    createPerformanceTest({
      count: 50,
      setupFn: async (count) => {
        const { mockStorage } = createDependencies(5000, 2);
        const index = new ChunkIndex(mockStorage);
        await index.loadData();
        const chunkIds = Array.from(
          { length: count },
          (_, i) => `chunk-${i.toString().padStart(6, "0")}`,
        );
        return { index, chunkIds };
      },
      testFn: ({ index, chunkIds }) => index.getChunks(chunkIds),
      constraints: {
        maxDuration: 2,
        maxMemory: 35,
      },
    }),
  );

  test(
    "ChunkIndex.getAllChunks by chunks",
    createPerformanceTest({
      count: [100, 300, 600, 1200],
      setupFn: async (chunkCount) => {
        const { mockStorage } = createDependencies(chunkCount, 1);
        const index = new ChunkIndex(mockStorage);
        await index.loadData();
        return { index };
      },
      testFn: ({ index }) => index.getAllChunks(),
      constraints: {
        maxDuration: 2,
        maxMemory: 700,
        scaling: "linear",
        tolerance: 2.0,
      },
    }),
  );

  test(
    "ChunkIndex.getChunks memory stability",
    createPerformanceTest({
      count: 1000,
      setupFn: async (iterations) => {
        const { mockStorage } = createDependencies(1000, 1);
        const index = new ChunkIndex(mockStorage);
        await index.loadData();
        const chunkIds = Array.from(
          { length: 20 },
          (_, i) => `chunk-${i.toString().padStart(6, "0")}`,
        );
        return { index, chunkIds, iterations };
      },
      testFn: async ({ index, chunkIds, iterations }) => {
        for (let i = 0; i < iterations; i++) {
          await index.getChunks(chunkIds);
        }
      },
      constraints: {
        maxMemory: 5500,
      },
    }),
  );
});
