/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { resource, common, tool } from "@copilot-ld/libtype";

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
      assert.strictEqual(MemoryService.length, 3); // config, storage, resourceIndex
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
    let mockResourceIndex;

    beforeEach(() => {
      mockConfig = {
        name: "memory", // Required for logging
      };

      mockStorage = {
        data: new Map(),
        async append(key, value) {
          const existing = this.data.get(key) || "";
          const newValue = existing ? `${existing}\n${value}` : value;
          this.data.set(key, newValue);
        },
        async get(key) {
          const value = this.data.get(key);
          if (!value) throw new Error("Not found");
          // Simulate JSONL parsing for .jsonl files
          if (key.endsWith(".jsonl")) {
            return value.split("\n").map((line) => JSON.parse(line));
          }
          return value;
        },
        async exists(key) {
          return this.data.has(key);
        },
      };

      mockResourceIndex = {
        resources: new Map(),
        async get(identifiers, _actor) {
          if (!identifiers || identifiers.length === 0) return [];
          return identifiers
            .map((id) => {
              let key;
              if (typeof id === "string") {
                key = id;
              } else if (id && typeof id.toString === "function" && id.type) {
                key = id.toString();
              } else if (id && id.name) {
                key = id.name;
              } else {
                key = String(id);
              }
              return this.resources.get(key);
            })
            .filter(Boolean);
        },
        put(_resource) {
          // No-op for tests
        },
        setupDefaults(options = {}) {
          const toolNames = options.tools || [];

          // Set up conversation
          this.resources.set(
            "test-conversation",
            common.Conversation.fromObject({
              id: { name: "test-conversation" },
              assistant_id: "common.Assistant.test-assistant",
            }),
          );

          // Set up assistant with tools
          this.resources.set(
            "common.Assistant.test-assistant",
            common.Assistant.fromObject({
              id: { name: "test-assistant", tokens: 50 },
              tools: toolNames,
              content: "You are a test assistant.",
              temperature: 0.3,
            }),
          );

          // Set up tool functions
          for (const name of toolNames) {
            this.resources.set(
              `tool.ToolFunction.${name}`,
              tool.ToolFunction.fromObject({
                id: { name, tokens: 20 },
                name,
                description: `${name} tool`,
              }),
            );
          }
        },
        addMessage(msg) {
          // Store by full identifier string (type.name) to match lookup behavior
          const id =
            msg.id?.type && msg.id?.toString
              ? msg.id.toString()
              : msg.id?.name || String(msg.id);
          this.resources.set(id, msg);
        },
      };

      // Set up default resources
      mockResourceIndex.setupDefaults({ tools: ["search"] });
    });

    test("constructor validates required dependencies", () => {
      assert.throws(
        () => new MemoryService(mockConfig, null),
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

    test("AppendMemory validates required resource_id parameter", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      await assert.rejects(
        () => service.AppendMemory({ identifiers: [] }),
        /resource_id is required/,
      );
    });

    test("AppendMemory processes identifiers correctly", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

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
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      await assert.rejects(
        () => service.GetWindow({}),
        /resource_id is required/,
      );
    });

    test("GetWindow validates required model parameter", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      await assert.rejects(
        () => service.GetWindow({ resource_id: "test-conversation" }),
        /model is required/,
      );

      await assert.rejects(
        () =>
          service.GetWindow({ resource_id: "test-conversation", model: "" }),
        /model is required/,
      );
    });

    test("GetWindow returns messages and tools structure", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.GetWindow({
        resource_id: "test-conversation",
        model: "test-model-1000",
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.messages), "Should have messages array");
      assert.ok(Array.isArray(result.tools), "Should have tools array");
    });

    test("GetWindow returns assistant as first message", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.GetWindow({
        resource_id: "test-conversation",
        model: "test-model-1000",
      });

      assert.ok(
        result.messages.length >= 1,
        "Should have at least one message",
      );
      assert.strictEqual(
        result.messages[0].id?.name,
        "test-assistant",
        "First message should be assistant",
      );
    });

    test("GetWindow returns temperature from assistant", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.GetWindow({
        resource_id: "test-conversation",
        model: "test-model-1000",
      });

      assert.ok(result.temperature, "Should have temperature");
      assert.strictEqual(
        result.temperature,
        0.3,
        "Temperature should match assistant config",
      );
    });

    test("GetWindow returns tools from assistant configuration", async () => {
      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.GetWindow({
        resource_id: "test-conversation",
        model: "test-model-1000",
      });

      assert.strictEqual(result.tools.length, 1, "Should have 1 tool");
      assert.strictEqual(
        result.tools[0].function?.name,
        "search",
        "Tool should be search",
      );
    });

    test("GetWindow returns conversation messages within budget", async () => {
      // Add some test messages to memory
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

      // Add messages to resource index so they can be loaded
      mockResourceIndex.addMessage(
        common.Message.fromObject({
          id: { name: "message1", tokens: 15 },
          role: "user",
          content: "Hello",
        }),
      );
      mockResourceIndex.addMessage(
        common.Message.fromObject({
          id: { name: "message2", tokens: 20 },
          role: "assistant",
          content: "Hi there",
        }),
      );

      const service = new MemoryService(
        mockConfig,
        mockStorage,
        mockResourceIndex,
      );

      const result = await service.GetWindow({
        resource_id: "test-conversation",
        model: "test-model-1000",
      });

      // Should return assistant + 2 conversation messages
      assert.strictEqual(result.messages.length, 3);
      assert.strictEqual(result.messages[0].id?.name, "test-assistant");
      assert.strictEqual(result.messages[1].id?.name, "message1");
      assert.strictEqual(result.messages[2].id?.name, "message2");
    });
  });
});
