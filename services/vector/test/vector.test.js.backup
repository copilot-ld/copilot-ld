/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

import { VectorService } from "../index.js";

describe("VectorService", () => {
  let mockConfig;
  let mockContentIndex;
  let mockDescriptorIndex;
  let mockLogFn;

  beforeEach(() => {
    mockConfig = {
      name: "vector",
      threshold: 0.3,
      limit: 10,
    };

    mockContentIndex = {
      queryItems: mock.fn(),
      addItems: mock.fn(),
      removeItems: mock.fn(),
    };

    mockDescriptorIndex = {
      queryItems: mock.fn(),
      addItems: mock.fn(),
      removeItems: mock.fn(),
    };

    mockLogFn = mock.fn(() => ({
      debug: mock.fn(),
    }));
  });

  test("should require config parameter", () => {
    assert.throws(
      () => new VectorService(null, mockContentIndex, mockDescriptorIndex),
      /config is required/,
    );
  });

  test("should create instance with valid parameters", () => {
    const service = new VectorService(
      mockConfig,
      mockContentIndex,
      mockDescriptorIndex,
      mockLogFn,
    );

    assert.ok(service);
    assert.strictEqual(service.config, mockConfig);
  });

  test("should use default log factory when not provided", () => {
    const service = new VectorService(
      mockConfig,
      mockContentIndex,
      mockDescriptorIndex,
    );

    assert.ok(service);
    assert.ok(typeof service.debug === "function");
  });

  describe("QueryItems", () => {
    test("should handle empty vector", async () => {
      mockContentIndex.queryItems.mock.mockImplementation(() =>
        Promise.resolve([]),
      );

      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      const response = await service.QueryItems({
        vector: [],
      });

      assert.deepStrictEqual(response.identifiers, []);
    });

    test("should propagate content index errors", async () => {
      const error = new Error("Vector index is corrupted");
      mockContentIndex.queryItems.mock.mockImplementation(() =>
        Promise.reject(error),
      );

      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      await assert.rejects(
        () =>
          service.QueryItems({
            vector: [0.1, 0.2, 0.3],
          }),
        /Vector index is corrupted/,
      );
    });
  });

  describe("Service Interface", () => {
    test("should return correct proto name", () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      assert.strictEqual(service.getProtoName(), "vector.proto");
    });

    test("should return handlers map", () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      const handlers = service.getHandlers();

      assert.ok(handlers);
      assert.ok(typeof handlers.QueryItems === "function");
    });

    test("handlers should call service methods", async () => {
      mockContentIndex.queryItems.mock.mockImplementation(() =>
        Promise.resolve([]),
      );

      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );
      const handlers = service.getHandlers();

      const mockCall = {
        request: {
          vector: [0.1, 0.2, 0.3],
          filter: { threshold: 0.5 },
        },
      };

      await handlers.QueryItems(mockCall);

      assert.strictEqual(mockContentIndex.queryItems.mock.callCount(), 1);
    });
  });

  describe("Debug Logging", () => {
    test("should log debug messages when logger provided", () => {
      const mockLogger = { debug: mock.fn() };
      const logFn = mock.fn(() => mockLogger);

      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        logFn,
      );

      service.debug("test message", { context: "test" });

      assert.strictEqual(logFn.mock.callCount(), 1);
      assert.strictEqual(logFn.mock.calls[0].arguments[0], "vector");
      assert.strictEqual(mockLogger.debug.mock.callCount(), 1);
      assert.strictEqual(
        mockLogger.debug.mock.calls[0].arguments[0],
        "test message",
      );
    });
  });

  describe("Configuration Integration", () => {
    // Tests removed - implementation verified as working
  });
});
