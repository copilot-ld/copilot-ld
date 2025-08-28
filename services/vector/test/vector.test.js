/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Mock vector indexes
const mockContentIndex = {
  queryItems: mock.fn(() => Promise.resolve([])),
};

const mockDescriptorIndex = {
  queryItems: mock.fn(() => Promise.resolve([])),
};

// Mock libconfig (not used in this test but would be used in real implementation)
const _mockLibconfig = {
  ServiceConfig: mock.fn(),
};

// Mock libservice
const mockLibservice = {
  Service: class MockService {
    constructor(config) {
      this.config = config;
    }
  },
};

// Create VectorService class for testing
class VectorService extends mockLibservice.Service {
  #contentIndex;
  #descriptorIndex;

  constructor(config, contentIndex, descriptorIndex) {
    super(config);
    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
  }

  async QueryItems(req) {
    // Determine which index to use based on index_type (default to content)
    const indexType = req.index_type || "content";
    const targetIndex =
      indexType === "descriptor" ? this.#descriptorIndex : this.#contentIndex;

    const results = await targetIndex.queryItems(
      req.vector,
      req.threshold,
      req.limit,
    );

    // If no token limit specified, return all results
    if (req.max_tokens === undefined || req.max_tokens === null) {
      return { results };
    }

    // Filter results by token count, keeping highest scored items
    const filteredResults = [];
    let totalTokens = 0;

    for (const result of results) {
      const resultTokens = result.tokens || 0;
      if (totalTokens + resultTokens <= req.max_tokens) {
        filteredResults.push(result);
        totalTokens += resultTokens;
      } else {
        break;
      }
    }

    return { results: filteredResults };
  }
}

describe("vector service", () => {
  describe("VectorService", () => {
    let vectorService;
    let mockConfig;

    beforeEach(() => {
      mockConfig = {
        threshold: 0.3,
        limit: 100,
      };

      vectorService = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      // Reset mocks
      mockContentIndex.queryItems = mock.fn(() => Promise.resolve([]));
      mockDescriptorIndex.queryItems = mock.fn(() => Promise.resolve([]));
    });

    test("creates vector service with config and indexes", () => {
      assert.strictEqual(vectorService.config, mockConfig);
    });

    test("QueryItems uses content index by default", async () => {
      const request = {
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
      };

      await vectorService.QueryItems(request);

      assert.strictEqual(mockContentIndex.queryItems.mock.callCount(), 1);
      assert.strictEqual(mockDescriptorIndex.queryItems.mock.callCount(), 0);

      const [vector, threshold, limit] =
        mockContentIndex.queryItems.mock.calls[0].arguments;
      assert.deepStrictEqual(vector, [0.1, 0.2, 0.3]);
      assert.strictEqual(threshold, 0.5);
      assert.strictEqual(limit, 10);
    });

    test("QueryItems uses content index when explicitly specified", async () => {
      const request = {
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
        index_type: "content",
      };

      await vectorService.QueryItems(request);

      assert.strictEqual(mockContentIndex.queryItems.mock.callCount(), 1);
      assert.strictEqual(mockDescriptorIndex.queryItems.mock.callCount(), 0);
    });

    test("QueryItems uses descriptor index when specified", async () => {
      const request = {
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
        index_type: "descriptor",
      };

      await vectorService.QueryItems(request);

      assert.strictEqual(mockContentIndex.queryItems.mock.callCount(), 0);
      assert.strictEqual(mockDescriptorIndex.queryItems.mock.callCount(), 1);

      const [vector, threshold, limit] =
        mockDescriptorIndex.queryItems.mock.calls[0].arguments;
      assert.deepStrictEqual(vector, [0.1, 0.2, 0.3]);
      assert.strictEqual(threshold, 0.5);
      assert.strictEqual(limit, 10);
    });

    test("QueryItems returns results from index", async () => {
      const expectedResults = [
        { id: "item1", score: 0.9 },
        { id: "item2", score: 0.7 },
      ];

      mockContentIndex.queryItems = mock.fn(() =>
        Promise.resolve(expectedResults),
      );

      const request = {
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
      };

      const response = await vectorService.QueryItems(request);

      assert.deepStrictEqual(response.results, expectedResults);
    });

    test("QueryItems filters results by token count", async () => {
      const mockResults = [
        { id: "item1", score: 0.9, tokens: 100 },
        { id: "item2", score: 0.8, tokens: 150 },
        { id: "item3", score: 0.7, tokens: 200 },
      ];

      mockContentIndex.queryItems = mock.fn(() => Promise.resolve(mockResults));

      const request = {
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
        max_tokens: 250,
      };

      const response = await vectorService.QueryItems(request);

      // Should include first two items (100 + 150 = 250) but not third (would be 350)
      assert.strictEqual(response.results.length, 2);
      assert.deepStrictEqual(response.results, [
        { id: "item1", score: 0.9, tokens: 100 },
        { id: "item2", score: 0.8, tokens: 150 },
      ]);
    });

    test("QueryItems returns all results when no max_tokens specified", async () => {
      const mockResults = [
        { id: "item1", score: 0.9, tokens: 100 },
        { id: "item2", score: 0.8, tokens: 150 },
      ];

      mockContentIndex.queryItems = mock.fn(() => Promise.resolve(mockResults));

      const request = {
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
      };

      const response = await vectorService.QueryItems(request);

      assert.deepStrictEqual(response.results, mockResults);
    });

    test("QueryItems handles items without token counts", async () => {
      const mockResults = [
        { id: "item1", score: 0.9 }, // No tokens field
        { id: "item2", score: 0.8, tokens: 100 },
      ];

      mockContentIndex.queryItems = mock.fn(() => Promise.resolve(mockResults));

      const request = {
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
        max_tokens: 150,
      };

      const response = await vectorService.QueryItems(request);

      // Should include both items (0 + 100 = 100 <= 150)
      assert.strictEqual(response.results.length, 2);
      assert.deepStrictEqual(response.results, mockResults);
    });
  });

  describe("VectorService Constructor", () => {
    test("passes only config to parent Service constructor", () => {
      const config = { name: "vector", port: 3006 };

      // Mock the real Service class behavior to validate constructor calls
      class TestService {
        constructor(config, grpcFactory, authFactory) {
          if (grpcFactory && typeof grpcFactory !== "function") {
            throw new Error("grpcFactory must be a function");
          }
          if (authFactory && typeof authFactory !== "function") {
            throw new Error("authFactory must be a function");
          }
          this.config = config;
        }
      }

      class TestVectorService extends TestService {
        constructor(config, contentIndex, descriptorIndex) {
          super(config); // Correct pattern - only pass config to parent
          this.contentIndex = contentIndex;
          this.descriptorIndex = descriptorIndex;
        }
      }

      // Should not throw when properly constructed
      assert.doesNotThrow(
        () =>
          new TestVectorService(config, mockContentIndex, mockDescriptorIndex),
      );

      // Demonstrate incorrect pattern would fail
      class IncorrectVectorService extends TestService {
        constructor(config, contentIndex, descriptorIndex) {
          super(config, contentIndex); // Incorrect - contentIndex is not a function
          this.contentIndex = contentIndex;
          this.descriptorIndex = descriptorIndex;
        }
      }

      assert.throws(
        () =>
          new IncorrectVectorService(
            config,
            mockContentIndex,
            mockDescriptorIndex,
          ),
        {
          message: /grpcFactory must be a function/,
        },
      );
    });
  });
});
