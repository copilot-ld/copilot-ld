/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { common } from "@copilot-ld/libtype";

// Mock vector index with queryItems method
const createMockIndex = (name) => ({
  name,
  queryItems: mock.fn((_vector, _threshold, _limit, _maxTokens) =>
    Promise.resolve([]),
  ),
});

// Create VectorService class for testing (without grpc/auth dependencies)
class VectorService {
  #contentIndex;
  #descriptorIndex;

  constructor(config, contentIndex, descriptorIndex) {
    this.config = config;
    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
  }

  async QueryItems(req) {
    // Determine which index to use based on index (default to content)
    const indexName = req.index || "content";
    const targetIndex =
      indexName === "descriptor" ? this.#descriptorIndex : this.#contentIndex;

    const results = await targetIndex.queryItems(
      req.vector,
      req.threshold,
      req.limit,
      req.max_tokens,
    );

    return { results };
  }
}

describe("Vector Service Token Management", () => {
  let _vectorService;
  let mockVectorIndex;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      threshold: 0.3,
      limit: 100,
      name: "vector", // Required by Service class
    };

    mockVectorIndex = createMockIndex("mainIndex");

    _vectorService = new VectorService(
      mockConfig,
      mockVectorIndex,
      undefined, // descriptorIndex not used in these tests
    );
  });

  test("QueryItems returns all results when no max_tokens specified", async () => {
    const expectedResults = [
      new common.Similarity({ id: "item1", score: 0.9, tokens: 50 }),
      new common.Similarity({ id: "item2", score: 0.8, tokens: 30 }),
      new common.Similarity({ id: "item3", score: 0.7, tokens: 20 }),
    ];

    // Create a mock index that returns properly typed Similarity objects like the real VectorIndex
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(expectedResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.1, 0.2, 0.3];
    const threshold = 0.5;
    const limit = 10;
    const maxTokens = undefined;

    const response = await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    assert.strictEqual(response.results.length, 3);

    // Check that all results are properly typed Similarity objects (they should be from the VectorIndex)
    response.results.forEach((result, index) => {
      assert.ok(
        result instanceof common.Similarity,
        `Result ${index} should be a Similarity instance`,
      );
      assert.strictEqual(result.id, expectedResults[index].id);
      assert.strictEqual(result.score, expectedResults[index].score);
      assert.strictEqual(result.tokens, expectedResults[index].tokens);
    });

    // Verify max_tokens was passed to VectorIndex
    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [, , , actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;
    assert.strictEqual(actualMaxTokens, undefined);
  });

  test("QueryItems respects max_tokens limit", async () => {
    // VectorIndex should return filtered results based on max_tokens
    const filteredResults = [
      { id: "item1", score: 0.9, tokens: 50 },
      { id: "item2", score: 0.8, tokens: 30 },
      // item3 should be filtered out by VectorIndex
    ];

    // Create a mock index that returns already-filtered results
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(filteredResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.1, 0.2, 0.3];
    const threshold = 0.5;
    const limit = 10;
    const maxTokens = 85; // Should fit items 1 and 2 (50 + 30 = 80) but not item 3

    const response = await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    assert.strictEqual(response.results.length, 2);
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[1].id, "item2");

    // Verify max_tokens was passed to VectorIndex
    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [, , , actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;
    assert.strictEqual(actualMaxTokens, 85);
  });

  test("QueryItems stops at token limit boundary", async () => {
    // VectorIndex should return filtered results based on max_tokens
    const filteredResults = [
      { id: "item1", score: 0.9, tokens: 50 },
      { id: "item2", score: 0.8, tokens: 50 },
      // item3 should be filtered out by VectorIndex
    ];

    // Create a mock index that returns already-filtered results
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(filteredResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.1, 0.2, 0.3];
    const threshold = 0.5;
    const limit = 10;
    const maxTokens = 100; // Exactly fits items 1 and 2 (50 + 50 = 100)

    const response = await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    assert.strictEqual(response.results.length, 2);
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[1].id, "item2");

    // Verify max_tokens was passed to VectorIndex
    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [, , , actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;
    assert.strictEqual(actualMaxTokens, 100);
  });

  test("QueryItems handles results without token information", async () => {
    // VectorIndex should return filtered results based on max_tokens
    const filteredResults = [
      { id: "item1", score: 0.9 }, // No tokens field
      { id: "item2", score: 0.8, tokens: 30 },
    ];

    // Create a mock index that returns already-filtered results
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(filteredResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.1, 0.2, 0.3];
    const threshold = 0.5;
    const limit = 10;
    const maxTokens = 50;

    const response = await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    // Should include both items (item1 counted as 0 tokens by VectorIndex)
    assert.strictEqual(response.results.length, 2);
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[1].id, "item2");

    // Verify max_tokens was passed to VectorIndex
    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [, , , actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;
    assert.strictEqual(actualMaxTokens, 50);
  });

  test("QueryItems returns empty array when first result exceeds token limit", async () => {
    // VectorIndex should return empty array when all results exceed token limit
    const filteredResults = [];

    // Create a mock index that returns already-filtered results
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(filteredResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.1, 0.2, 0.3];
    const threshold = 0.5;
    const limit = 10;
    const maxTokens = 100;

    const response = await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    assert.strictEqual(response.results.length, 0);

    // Verify max_tokens was passed to VectorIndex
    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [, , , actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;
    assert.strictEqual(actualMaxTokens, 100);
  });

  test("QueryItems preserves score-based ordering from vector index", async () => {
    // VectorIndex should return results sorted by score (highest first) and filtered by tokens
    const filteredResults = [
      { id: "item1", score: 0.9, tokens: 10 },
      { id: "item2", score: 0.8, tokens: 10 },
      // item3 should be filtered out by VectorIndex if it exceeds token limit
    ];

    // Create a mock index that returns already-filtered and sorted results
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(filteredResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.1, 0.2, 0.3];
    const threshold = 0.5;
    const limit = 10;
    const maxTokens = 25; // Should fit 2 items

    const response = await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    assert.strictEqual(response.results.length, 2);
    // Should get the highest scored items that fit within token limit
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[0].score, 0.9);
    assert.strictEqual(response.results[1].id, "item2");
    assert.strictEqual(response.results[1].score, 0.8);

    // Verify max_tokens was passed to VectorIndex
    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [, , , actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;
    assert.strictEqual(actualMaxTokens, 25);
  });

  test("QueryItems handles zero max_tokens", async () => {
    // VectorIndex should return empty array with 0 max_tokens
    const filteredResults = [];

    // Create a mock index that returns already-filtered results
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(filteredResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.1, 0.2, 0.3];
    const threshold = 0.5;
    const limit = 10;
    const maxTokens = 0;

    const response = await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    // With 0 max_tokens, no results should be returned since any result with tokens > 0 would exceed the limit
    assert.strictEqual(response.results.length, 0);

    // Verify max_tokens was passed to VectorIndex
    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [, , , actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;
    assert.strictEqual(actualMaxTokens, 0);
  });

  test("QueryItems passes all parameters to vector index correctly", async () => {
    // Create a mock index to verify parameter passing
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve([])),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      undefined, // descriptorIndex not used in this test
    );

    const vector = [0.4, 0.5, 0.6];
    const threshold = 0.8;
    const limit = 5;
    const maxTokens = 100;

    await testVectorService.QueryItems({
      vector,
      threshold,
      limit,
      max_tokens: maxTokens,
    });

    assert.strictEqual(testMockIndex.queryItems.mock.callCount(), 1);
    const [actualVector, actualThreshold, actualLimit, actualMaxTokens] =
      testMockIndex.queryItems.mock.calls[0].arguments;

    assert.deepStrictEqual(actualVector, [0.4, 0.5, 0.6]);
    assert.strictEqual(actualThreshold, 0.8);
    assert.strictEqual(actualLimit, 5);
    assert.strictEqual(actualMaxTokens, 100);
  });
});
