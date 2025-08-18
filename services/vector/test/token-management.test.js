/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { common } from "@copilot-ld/libtype";

// Mock vector index with queryItems method
const createMockIndex = (name) => ({
  name,
  queryItems: mock.fn((_vector, _threshold, _limit) => Promise.resolve([])),
});

// Mock gRPC factory to avoid grpc dependencies in tests
const mockGrpcFactory = () => ({
  grpc: {},
  protoLoader: {},
});

// Mock auth factory to avoid environment variable requirements
const mockAuthFactory = () => ({
  intercept: () => {},
  validateCall: () => ({ isValid: true }),
  createClientInterceptor: () => {},
});

// Import the actual service
import { VectorService } from "../index.js";

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
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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
  });

  test("QueryItems respects max_tokens limit", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 50 },
      { id: "item2", score: 0.8, tokens: 30 },
      { id: "item3", score: 0.7, tokens: 40 },
    ];

    // Create a mock index that returns our test data
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(expectedResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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
  });

  test("QueryItems stops at token limit boundary", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 50 },
      { id: "item2", score: 0.8, tokens: 50 },
      { id: "item3", score: 0.7, tokens: 1 }, // This would exceed limit
    ];

    // Create a mock index that returns our test data
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(expectedResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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
  });

  test("QueryItems handles results without token information", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9 }, // No tokens field
      { id: "item2", score: 0.8, tokens: 30 },
    ];

    // Create a mock index that returns our test data
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(expectedResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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

    // Should include both items (item1 counted as 0 tokens)
    assert.strictEqual(response.results.length, 2);
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[1].id, "item2");
  });

  test("QueryItems returns empty array when first result exceeds token limit", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 150 }, // Exceeds limit
    ];

    // Create a mock index that returns our test data
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(expectedResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
      undefined, // logFn
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
  });

  test("QueryItems preserves score-based ordering from vector index", async () => {
    // Vector index should return results sorted by score (highest first)
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 10 },
      { id: "item2", score: 0.8, tokens: 10 },
      { id: "item3", score: 0.7, tokens: 10 },
    ];

    // Create a mock index that returns our test data
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(expectedResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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
  });

  test("QueryItems handles zero max_tokens", async () => {
    const expectedResults = [{ id: "item1", score: 0.9, tokens: 50 }];

    // Create a mock index that returns our test data
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve(expectedResults)),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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
  });

  test("QueryItems passes all parameters to vector index correctly", async () => {
    // Create a mock index to verify parameter passing
    const testMockIndex = {
      queryItems: mock.fn(() => Promise.resolve([])),
    };

    const testVectorService = new VectorService(
      mockConfig,
      testMockIndex,
      mockGrpcFactory,
      mockAuthFactory,
      undefined, // logFn
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
    const [actualVector, actualThreshold, actualLimit] =
      testMockIndex.queryItems.mock.calls[0].arguments;

    assert.deepStrictEqual(actualVector, [0.4, 0.5, 0.6]);
    assert.strictEqual(actualThreshold, 0.8);
    assert.strictEqual(actualLimit, 5);
  });
});
