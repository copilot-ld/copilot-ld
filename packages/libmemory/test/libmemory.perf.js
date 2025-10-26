/* eslint-env node */
import { test, describe } from "node:test";

import { MemoryFilter, MemoryWindow, MemoryIndex } from "../index.js";
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
    "MemoryFilter.filterByBudget by identifier count",
    createPerformanceTest({
      count: [500, 1000, 2000, 5000],
      setupFn: (identifierCount) => {
        const identifiers = generateMockIdentifiers(identifierCount);
        const budget = 50000;
        return { identifiers, budget };
      },
      testFn: ({ identifiers, budget }) =>
        MemoryFilter.filterByBudget(identifiers, budget),
      constraints: {
        maxDuration: 40,
        maxMemory: 3000,
        scaling: "linear",
        tolerance: 3.0,
      },
    }),
  );

  test(
    "MemoryFilter.splitToolsAndHistory by memory size",
    createPerformanceTest({
      count: [500, 1000, 2000, 4000],
      setupFn: (memorySize) => {
        const toolCount = Math.floor(memorySize * 0.3);
        const historyCount = memorySize - toolCount;
        const tools = generateMockIdentifiers(toolCount, "tool.ToolFunction");
        const history = generateMockIdentifiers(historyCount, "common.Message");
        const memory = [...tools, ...history].sort(() => Math.random() - 0.5);
        return { memory };
      },
      testFn: ({ memory }) => MemoryFilter.splitToolsAndHistory(memory),
      constraints: {
        maxDuration: 10,
        maxMemory: 500,
        scaling: "linear",
        tolerance: 3.5,
      },
    }),
  );

  test(
    "MemoryWindow.build by window size",
    createPerformanceTest({
      count: [50, 100, 200, 500],
      setupFn: async (windowSize) => {
        const { mockStorage } = createDependencies(windowSize);
        const memoryIndex = new MemoryIndex(mockStorage, "index.jsonl");
        await memoryIndex.loadData();
        const memoryWindow = new MemoryWindow(memoryIndex);
        const budget = 45000;
        const allocation = {
          tools: 0.2,
          history: 0.8,
        };
        return { memoryWindow, budget, allocation };
      },
      testFn: ({ memoryWindow, budget, allocation }) =>
        memoryWindow.build(budget, allocation),
      constraints: {
        maxDuration: 120,
        maxMemory: 5000,
        scaling: "linear",
        tolerance: 2.5,
      },
    }),
  );

  test(
    "MemoryFilter.filterByBudget memory stability",
    createPerformanceTest({
      count: 10000,
      setupFn: (iterations) => {
        const identifiers = generateMockIdentifiers(100);
        const budget = 10000;
        return { identifiers, budget, iterations };
      },
      testFn: async ({ identifiers, budget, iterations }) => {
        for (let i = 0; i < iterations; i++) {
          MemoryFilter.filterByBudget(identifiers, budget);
        }
      },
      constraints: {
        maxMemory: 2000,
      },
    }),
  );
});
