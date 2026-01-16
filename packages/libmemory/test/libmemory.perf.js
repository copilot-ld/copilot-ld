import { test, describe } from "node:test";

import { MemoryWindow } from "../index.js";
import { MemoryIndex } from "../index/memory.js";
import { createPerformanceTest } from "@copilot-ld/libperf";

describe("LibMemory Performance Tests", () => {
  /**
   * Generate mock identifiers with scores and tokens
   * @param {number} count - Number of identifiers to generate
   * @param {string} typePrefix - Type prefix for identifiers
   * @returns {object[]} Mock identifiers
   */
  function generateMockIdentifiers(count, typePrefix = "common.Message") {
    const identifiers = [];

    for (let i = 0; i < count; i++) {
      identifiers.push({
        name: `item-${i.toString().padStart(6, "0")}`,
        type: typePrefix,
        score: Math.random(),
        tokens: Math.floor(Math.random() * 500) + 100,
      });
    }

    return identifiers;
  }

  /**
   * Create mock storage and memory index
   * @param {number} itemCount - Number of items in memory
   * @returns {object} Mock dependencies
   */
  function createDependencies(itemCount) {
    const items = generateMockIdentifiers(itemCount);
    const jsonlData = items
      .map((item) => JSON.stringify({ id: item.name, identifier: item }))
      .join("\n");

    const mockStorage = {
      get: (key) => {
        if (key === "index.jsonl") {
          return Promise.resolve(Buffer.from(jsonlData));
        }
        return Promise.resolve(Buffer.from(""));
      },
      exists: (key) => {
        if (key === "index.jsonl") return Promise.resolve(true);
        return Promise.resolve(false);
      },
      put: () => Promise.resolve(),
    };

    return { mockStorage, items };
  }

  test(
    "MemoryWindow.build by window size",
    createPerformanceTest({
      count: [50, 100, 200, 500],
      setupFn: async (windowSize) => {
        const { mockStorage } = createDependencies(windowSize);
        const memoryIndex = new MemoryIndex(mockStorage, "index.jsonl");
        await memoryIndex.loadData();

        // Mock resourceIndex for testing
        const mockResourceIndex = {
          get: async (ids) => {
            // Handle conversation lookup
            if (ids[0] === "test-conversation") {
              return [
                {
                  identifier: { name: "test-conversation" },
                  descriptor: { name: "Test Conversation" },
                  type: "common.Conversation",
                  assistant_id: "test-assistant",
                },
              ];
            }
            // Handle assistant lookup
            if (ids[0] === "test-assistant") {
              return [
                {
                  identifier: { name: "test-assistant" },
                  descriptor: { name: "Test Assistant" },
                  type: "common.Assistant",
                  instructions: "Test instructions",
                  tools: [], // No tools to keep it simple
                },
              ];
            }
            // Handle tool function lookups (return empty array if tools requested)
            if (ids[0] && ids[0].startsWith("tool.ToolFunction.")) {
              return [];
            }
            // Handle message lookups (return mock messages based on identifiers)
            return ids.map((id, idx) => ({
              identifier: { name: id },
              role: idx % 2 === 0 ? "user" : "assistant",
              content: `Message ${idx}`,
            }));
          },
        };

        const memoryWindow = new MemoryWindow(
          "test-conversation",
          mockResourceIndex,
          memoryIndex,
        );
        const model = "gpt-4o";
        return { memoryWindow, model };
      },
      testFn: ({ memoryWindow, model }) => memoryWindow.build(model),
      constraints: {
        maxDuration: 120,
        maxMemory: 5000,
        scaling: "linear",
        tolerance: 2.5,
      },
    }),
  );
});
