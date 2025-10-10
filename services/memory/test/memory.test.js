/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { MemoryService } from "../index.js";

describe("memory service", () => {
  describe("MemoryService", () => {
    test("exports MemoryService class", () => {
      assert.strictEqual(typeof MemoryService, "function");
      assert.ok(MemoryService.prototype);
    });

    test("MemoryService has Append method", () => {
      assert.strictEqual(typeof MemoryService.prototype.Append, "function");
    });

    test("MemoryService has GetWindow method", () => {
      assert.strictEqual(typeof MemoryService.prototype.GetWindow, "function");
    });

    test("MemoryService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(MemoryService.length, 4); // config, storage, resourceIndex, logFn
    });

    test("MemoryService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(MemoryService.prototype);
      assert(methods.includes("Append"));
      assert(methods.includes("GetWindow"));
      assert(methods.includes("constructor"));
    });
  });

  describe("MemoryService business logic", () => {
    let mockConfig;
    let mockStorage;
    let mockResourceIndex;

    beforeEach(() => {
      mockConfig = {
        name: "memory", // Required for logging
      };

      mockStorage = {
        append: async () => {},
        get: async () => [],
      };

      mockResourceIndex = {
        findByPrefix: async () => [
          { type: "common.Message", name: "message1" },
          { type: "common.Message", name: "message2" },
        ],
      };
    });

    test("constructor validates required dependencies", () => {
      assert.throws(
        () => new MemoryService(mockConfig, null, mockResourceIndex),
        /storage is required/,
      );

      assert.throws(
        () => new MemoryService(mockConfig, mockStorage, null),
        /resourceIndex is required/,
      );
    });

    test("creates service instance with valid parameters", () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("Append validates required for parameter", async () => {
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

    test("Append processes identifiers correctly", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.Append({
        for: "test-conversation",
        identifiers: [{ type: "common.Message", name: "message1" }],
      });

      assert.ok(result);
      assert.strictEqual(result.accepted, "test-conversation");
    });

    test("GetWindow validates required for parameter", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      await assert.rejects(() => service.GetWindow({}), /for is required/);
    });

    test("GetWindow returns memory window structure", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.GetWindow({
        for: "test-conversation",
        vector: [0.1, 0.2, 0.3],
        budget: 1000,
      });

      assert.ok(result);
      assert.strictEqual(result.for, "test-conversation");
      assert.ok(Array.isArray(result.tools));
      assert.ok(Array.isArray(result.context));
      assert.ok(Array.isArray(result.history));
    });

    test("GetWindow filters message types correctly", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.GetWindow({
        for: "test-conversation",
      });

      // Should find messages in history
      assert.strictEqual(result.history.length, 2);
      assert.ok(
        result.history.every((item) => item.type.startsWith("common.Message")),
      );
    });
  });
});
