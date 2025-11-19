/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { resource } from "@copilot-ld/libtype";

// Module under test
import { MemoryService } from "../index.js";

describe("memory service", () => {
  describe("MemoryService", () => {
    test("exports MemoryService class", () => {
      assert.strictEqual(typeof MemoryService, "function");
      assert.ok(MemoryService.prototype);
    });

    test("MemoryService has AppendMemory method", () => {
      assert.strictEqual(
        typeof MemoryService.prototype.AppendMemory,
        "function",
      );
    });

    test("MemoryService has GetWindow method", () => {
      assert.strictEqual(typeof MemoryService.prototype.GetWindow, "function");
    });

    test("MemoryService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(MemoryService.length, 2); // config, storage
    });

    test("MemoryService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(MemoryService.prototype);
      assert(methods.includes("AppendMemory"));
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
        async append(key, value) {
          this.data = this.data || new Map();
          const existing = this.data.get(key) || "";
          const newValue = existing ? `${existing}\n${value}` : value;
          this.data.set(key, newValue);
        },
        async get(key) {
          this.data = this.data || new Map();
          const value = this.data.get(key);
          if (!value) throw new Error("Not found");
          // Simulate JSONL parsing for .jsonl files
          if (key.endsWith(".jsonl")) {
            return value.split("\n").map((line) => JSON.parse(line));
          }
          return value;
        },
        async exists(key) {
          this.data = this.data || new Map();
          return this.data.has(key);
        },
      };

      mockLogFn = () => ({
        debug: () => {},
        error: () => {},
      });
    });

    test("constructor validates required dependencies", () => {
      assert.throws(
        () => new MemoryService(mockConfig, null),
        /storage is required/,
      );
    });

    test("creates service instance with valid parameters", () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("AppendMemory validates required for parameter", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      await assert.rejects(
        () => service.AppendMemory({ identifiers: [] }),
        /resource_id is required/,
      );
    });

    test("AppendMemory processes identifiers correctly", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      const result = await service.AppendMemory({
        resource_id: "test-conversation",
        identifiers: [
          resource.Identifier.fromObject({
            type: "common.Message",
            name: "message1",
            tokens: 10,
          }),
        ],
      });

      assert.ok(result);
      assert.strictEqual(result.accepted, "test-conversation");
    });

    test("GetWindow validates required resource_id parameter", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      await assert.rejects(
        () => service.GetWindow({}),
        /resource_id is required/,
      );
    });

    test("GetWindow returns memory window structure", async () => {
      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      const result = await service.GetWindow({
        resource_id: "test-conversation",
        budget: 1000,
        allocation: {
          tools: 0.3,
          context: 0.3,
          conversation: 0.4,
        },
      });

      assert.ok(result);
      assert.strictEqual(result.resource_id, "test-conversation");
      assert.ok(Array.isArray(result.tools));
      assert.ok(Array.isArray(result.context));
      assert.ok(Array.isArray(result.conversation));
    });

    test("GetWindow filters message types correctly", async () => {
      // Add some test data first
      await mockStorage.append(
        "test-conversation.jsonl",
        JSON.stringify({
          id: "tool.ToolFunction.tool1",
          identifier: resource.Identifier.fromObject({
            type: "tool.ToolFunction",
            name: "tool1",
            tokens: 10,
          }),
        }),
      );
      await mockStorage.append(
        "test-conversation.jsonl",
        JSON.stringify({
          id: "common.Message.message1",
          identifier: resource.Identifier.fromObject({
            type: "common.Message",
            name: "message1",
            tokens: 15,
          }),
        }),
      );
      await mockStorage.append(
        "test-conversation.jsonl",
        JSON.stringify({
          id: "common.Message.message2",
          identifier: resource.Identifier.fromObject({
            type: "common.Message",
            name: "message2",
            tokens: 20,
          }),
        }),
      );

      const service = new MemoryService(mockConfig, mockStorage, mockLogFn);

      const result = await service.GetWindow({
        resource_id: "test-conversation",
        budget: 1000,
        allocation: {
          tools: 0.3,
          context: 0.3,
          conversation: 0.4,
        },
      });

      // Should have tools and context separated
      assert.strictEqual(result.tools.length, 1);
      assert.strictEqual(result.context.length, 2);
      assert.ok(
        result.context.every((item) => item.type.startsWith("common.Message")),
      );
    });
  });
});
