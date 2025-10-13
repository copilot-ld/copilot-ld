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
      assert.strictEqual(MemoryService.length, 3); // config, storage, logFn
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
    let mockLogFn;

    beforeEach(() => {
      mockConfig = {
        name: "memory", // Required for logging
      };

      mockStorage = {
        append: async () => {},
        get: async () => [],
      };

      mockLogFn = () => ({
        debug: () => {},
        error: () => {},
      });
    });

    test("constructor validates required dependencies", () => {
      assert.throws(
        () => new MemoryService(mockConfig, null, mockLogFn),
        /storage is required/,
      );
    });

    test("creates service instance with valid parameters", () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("Append validates required for parameter", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      await assert.rejects(
        () => service.Append({ identifiers: [] }),
        /for is required/,
      );
    });

    test("Append processes identifiers correctly", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      const result = await service.Append({
        for: "test-conversation",
        identifiers: [{ type: "common.Message", name: "message1" }],
      });

      assert.ok(result);
      assert.strictEqual(result.accepted, "test-conversation");
    });

    test("GetWindow validates required for parameter", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      await assert.rejects(() => service.GetWindow({}), /for is required/);
    });

    test("GetWindow returns memory window structure", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      const result = await service.GetWindow({
        for: "test-conversation",
        budget: 1000,
      });

      assert.ok(result);
      assert.strictEqual(result.for, "test-conversation");
      assert.ok(Array.isArray(result.tools));
      assert.ok(Array.isArray(result.history));
    });

    test("GetWindow filters message types correctly", async () => {
      // Mock storage with some test data
      mockStorage.get = async () => [
        { type: "tool.ToolFunction", name: "tool1" },
        { type: "common.Message", name: "message1" },
        { type: "common.Message", name: "message2" },
      ];

      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      const result = await service.GetWindow({
        for: "test-conversation",
      });

      // Should have tools and history separated
      assert.strictEqual(result.tools.length, 1);
      assert.strictEqual(result.history.length, 2);
      assert.ok(
        result.history.every((item) => item.type.startsWith("common.Message")),
      );
    });
  });
});
