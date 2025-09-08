/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

import { MemoryService } from "../index.js";

describe("MemoryService", () => {
  let mockConfig;
  let mockStorage;
  let mockResourceIndex;
  let mockLogFn;

  beforeEach(() => {
    mockConfig = {
      name: "memory",
      maxMemories: 100,
      ttl: 3600000, // 1 hour
    };

    mockStorage = {
      get: mock.fn(),
      put: mock.fn(),
      append: mock.fn(),
      delete: mock.fn(),
      exists: mock.fn(),
    };

    mockResourceIndex = {
      get: mock.fn(),
      put: mock.fn(),
      list: mock.fn(),
      delete: mock.fn(),
      findByPrefix: mock.fn(),
    };

    mockLogFn = mock.fn(() => ({
      debug: mock.fn(),
    }));
  });

  test("should require config parameter", () => {
    assert.throws(
      () => new MemoryService(null, mockStorage, mockResourceIndex),
      /config is required/,
    );
  });

  test("should create instance with valid parameters", () => {
    const service = new MemoryService(
      mockConfig,
      mockStorage,
      mockResourceIndex,
      mockLogFn,
    );

    assert.ok(service);
    assert.strictEqual(service.config, mockConfig);
  });

  test("should use default log factory when not provided", () => {
    const service = new MemoryService(
      mockConfig,
      mockStorage,
      mockResourceIndex,
    );

    assert.ok(service);
    assert.ok(typeof service.debug === "function");
  });

  describe("Append", () => {
    test("should append identifiers successfully", async () => {
      mockStorage.append.mock.mockImplementation(() => Promise.resolve());

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
        mockLogFn,
      );

      const request = {
        for: "test-resource",
        identifiers: [
          { type: "resource", name: "test1" },
          { type: "resource", name: "test2" },
        ],
      };

      const response = await service.Append(request);

      assert.strictEqual(mockStorage.append.mock.callCount(), 1);
      assert.ok(response.accepted);
    });

    test("should handle missing for parameter", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      await assert.rejects(
        () => service.Append({ identifiers: [] }),
        /for is required/,
      );
    });

    test("should propagate storage errors", async () => {
      const error = new Error("Storage unavailable");
      mockStorage.append.mock.mockImplementation(() => Promise.reject(error));

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      await assert.rejects(
        () =>
          service.Append({
            for: "test-resource",
            identifiers: [{ type: "resource", name: "test" }],
          }),
        /Storage unavailable/,
      );
    });
  });

  describe("GetWindow", () => {
    test("should get memory window successfully", async () => {
      const mockIdentifiers = [
        { type: "resource", name: "test1", tokens: 100 },
        { type: "resource", name: "test2", tokens: 200 },
      ];

      // Mock storage.get to return context identifiers
      mockStorage.get.mock.mockImplementation(() =>
        Promise.resolve(
          mockIdentifiers.map((id) => JSON.stringify(id)).join("\n"),
        ),
      );

      // Mock resourceIndex.findByPrefix to return message identifiers
      const mockMessageIdentifiers = [
        { type: "common.MessageV2", name: "msg1", tokens: 50 },
        { type: "common.MessageV2", name: "msg2", tokens: 75 },
      ];
      mockResourceIndex.findByPrefix.mock.mockImplementation(() =>
        Promise.resolve(mockMessageIdentifiers),
      );

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const request = {
        for: "test-resource",
        vector: [0.1, 0.2, 0.3],
        budget: 500,
        allocation: {
          tools: 100,
          context: 200,
          history: 200,
        },
      };

      const response = await service.GetWindow(request);

      assert.strictEqual(response.for, "test-resource");
      assert.ok(Array.isArray(response.tools));
      assert.ok(Array.isArray(response.context));
      assert.ok(Array.isArray(response.history));
    });

    test("should handle empty memory", async () => {
      mockStorage.get.mock.mockImplementation(() => Promise.resolve(""));
      mockResourceIndex.findByPrefix.mock.mockImplementation(() =>
        Promise.resolve([]),
      );

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const response = await service.GetWindow({
        for: "empty-resource",
        vector: [0.1, 0.2, 0.3],
        budget: 500,
      });

      assert.strictEqual(response.for, "empty-resource");
      assert.deepStrictEqual(response.tools, []);
      assert.deepStrictEqual(response.context, []);
      assert.deepStrictEqual(response.history, []);
    });

    test("should propagate storage errors", async () => {
      const error = new Error("Storage read failed");
      mockResourceIndex.findByPrefix.mock.mockImplementation(() =>
        Promise.reject(error),
      );

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      await assert.rejects(
        () =>
          service.GetWindow({
            for: "test-resource",
            vector: [0.1, 0.2, 0.3],
            budget: 500,
          }),
        /Storage read failed/,
      );
    });
  });

  describe("Service Interface", () => {
    test("should return correct proto name", () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      assert.strictEqual(service.getProtoName(), "memory.proto");
    });

    test("should return handlers map", () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const handlers = service.getHandlers();

      assert.ok(handlers);
      assert.ok(typeof handlers.Append === "function");
      assert.ok(typeof handlers.GetWindow === "function");
    });

    test("handlers should call service methods", async () => {
      mockStorage.append.mock.mockImplementation(() => Promise.resolve());

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );
      const handlers = service.getHandlers();

      const mockCall = {
        request: {
          for: "test-resource",
          identifiers: [{ type: "resource", name: "test" }],
        },
      };

      await handlers.Append(mockCall);

      assert.strictEqual(mockStorage.append.mock.callCount(), 1);
    });
  });

  describe("Debug Logging", () => {
    test("should log debug messages when logger provided", () => {
      const mockLogger = { debug: mock.fn() };
      const logFn = mock.fn(() => mockLogger);

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
        logFn,
      );

      service.debug("test message", { context: "test" });

      assert.strictEqual(logFn.mock.callCount(), 1);
      assert.strictEqual(logFn.mock.calls[0].arguments[0], "memory");
      assert.strictEqual(mockLogger.debug.mock.callCount(), 1);
      assert.strictEqual(
        mockLogger.debug.mock.calls[0].arguments[0],
        "test message",
      );
    });
  });
});
