/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Mock vector index with queryItems method
const createMockIndex = (name) => ({
  name,
  queryItems: mock.fn((_vector, _threshold, _limit) => Promise.resolve([])),
});

// Mock queryIndices function
let _mockQueryIndices;

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
  let mockVectorIndices;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      threshold: 0.3,
      limit: 100,
      name: "vector", // Required by Service class
    };

    const mockIndex1 = createMockIndex("index1");
    const mockIndex2 = createMockIndex("index2");

    mockVectorIndices = new Map([
      ["index1", mockIndex1],
      ["index2", mockIndex2],
    ]);

    // Create a fresh mock for each test
    _mockQueryIndices = mock.fn(() => Promise.resolve([]));

    _vectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      _mockQueryIndices, // Inject the mock queryIndices function
    );
  });

  test("QueryItems returns all results when no max_tokens specified", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 50 },
      { id: "item2", score: 0.8, tokens: 30 },
      { id: "item3", score: 0.7, tokens: 20 },
    ];

    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() =>
      Promise.resolve(expectedResults),
    );
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.1, 0.2, 0.3],
      threshold: 0.5,
      limit: 10,
    };

    const response = await testVectorService.QueryItems(request);

    assert.strictEqual(response.results.length, 3);
    assert.deepStrictEqual(response.results, expectedResults);
  });

  test("QueryItems respects max_tokens limit", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 50 },
      { id: "item2", score: 0.8, tokens: 30 },
      { id: "item3", score: 0.7, tokens: 40 },
    ];

    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() =>
      Promise.resolve(expectedResults),
    );
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.1, 0.2, 0.3],
      threshold: 0.5,
      limit: 10,
      max_tokens: 85, // Should fit items 1 and 2 (50 + 30 = 80) but not item 3
    };

    const response = await testVectorService.QueryItems(request);

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

    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() =>
      Promise.resolve(expectedResults),
    );
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.1, 0.2, 0.3],
      threshold: 0.5,
      limit: 10,
      max_tokens: 100, // Exactly fits items 1 and 2 (50 + 50 = 100)
    };

    const response = await testVectorService.QueryItems(request);

    assert.strictEqual(response.results.length, 2);
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[1].id, "item2");
  });

  test("QueryItems handles results without token information", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9 }, // No tokens field
      { id: "item2", score: 0.8, tokens: 30 },
    ];

    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() =>
      Promise.resolve(expectedResults),
    );
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.1, 0.2, 0.3],
      threshold: 0.5,
      limit: 10,
      max_tokens: 50,
    };

    const response = await testVectorService.QueryItems(request);

    // Should include both items (item1 counted as 0 tokens)
    assert.strictEqual(response.results.length, 2);
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[1].id, "item2");
  });

  test("QueryItems returns empty array when first result exceeds token limit", async () => {
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 150 }, // Exceeds limit
    ];

    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() =>
      Promise.resolve(expectedResults),
    );
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.1, 0.2, 0.3],
      threshold: 0.5,
      limit: 10,
      max_tokens: 100,
    };

    const response = await testVectorService.QueryItems(request);

    assert.strictEqual(response.results.length, 0);
  });

  test("QueryItems preserves score-based ordering from queryIndices", async () => {
    // queryIndices should return results sorted by score (highest first)
    const expectedResults = [
      { id: "item1", score: 0.9, tokens: 10 },
      { id: "item2", score: 0.8, tokens: 10 },
      { id: "item3", score: 0.7, tokens: 10 },
    ];

    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() =>
      Promise.resolve(expectedResults),
    );
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.1, 0.2, 0.3],
      threshold: 0.5,
      limit: 10,
      max_tokens: 25, // Should fit 2 items
    };

    const response = await testVectorService.QueryItems(request);

    assert.strictEqual(response.results.length, 2);
    // Should get the highest scored items that fit within token limit
    assert.strictEqual(response.results[0].id, "item1");
    assert.strictEqual(response.results[0].score, 0.9);
    assert.strictEqual(response.results[1].id, "item2");
    assert.strictEqual(response.results[1].score, 0.8);
  });

  test("QueryItems handles zero max_tokens", async () => {
    const expectedResults = [{ id: "item1", score: 0.9, tokens: 50 }];

    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() =>
      Promise.resolve(expectedResults),
    );
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.1, 0.2, 0.3],
      threshold: 0.5,
      limit: 10,
      max_tokens: 0,
    };

    const response = await testVectorService.QueryItems(request);

    // With 0 max_tokens, no results should be returned since any result with tokens > 0 would exceed the limit
    assert.strictEqual(response.results.length, 0);
  });

  test("QueryItems passes all parameters to queryIndices correctly", async () => {
    // Create a new service with a specific mock for this test
    const testMockQueryIndices = mock.fn(() => Promise.resolve([]));
    const testVectorService = new VectorService(
      mockConfig,
      mockVectorIndices,
      mockGrpcFactory,
      mockAuthFactory,
      testMockQueryIndices,
    );

    const request = {
      indices: ["index1"],
      vector: [0.4, 0.5, 0.6],
      threshold: 0.8,
      limit: 5,
      max_tokens: 100,
    };

    await testVectorService.QueryItems(request);

    assert.strictEqual(testMockQueryIndices.mock.callCount(), 1);
    const [requestedIndices, vector, threshold, limit] =
      testMockQueryIndices.mock.calls[0].arguments;

    assert.strictEqual(requestedIndices.length, 1);
    assert.deepStrictEqual(vector, [0.4, 0.5, 0.6]);
    assert.strictEqual(threshold, 0.8);
    assert.strictEqual(limit, 5);
  });
});
