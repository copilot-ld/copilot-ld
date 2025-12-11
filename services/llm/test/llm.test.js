/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { LlmService } from "../index.js";

describe("llm service", () => {
  describe("LlmService", () => {
    test("exports LlmService class", () => {
      assert.strictEqual(typeof LlmService, "function");
      assert.ok(LlmService.prototype);
    });

    test("LlmService has CreateCompletions method", () => {
      assert.strictEqual(
        typeof LlmService.prototype.CreateCompletions,
        "function",
      );
    });

    test("LlmService has CreateEmbeddings method", () => {
      assert.strictEqual(
        typeof LlmService.prototype.CreateEmbeddings,
        "function",
      );
    });

    test("LlmService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(LlmService.prototype);
      assert(methods.includes("CreateCompletions"));
      assert(methods.includes("CreateEmbeddings"));
      assert(methods.includes("constructor"));
    });
  });

  describe("LlmService business logic", () => {
    let mockConfig;
    let mockMemoryClient;
    let mockLlmFactory;
    let mockCopilot;

    beforeEach(() => {
      mockConfig = {
        name: "llm", // Required for logging
        model: "gpt-4o",
      };

      mockMemoryClient = {
        GetWindow: async () => ({
          messages: [{ role: "system", content: "You are an assistant" }],
          tools: [],
          temperature: "0.7",
        }),
      };

      mockCopilot = {
        createCompletions: async () => ({
          id: "test-completion",
          choices: [
            { message: { role: "assistant", content: "Test response" } },
          ],
          usage: { total_tokens: 100 },
        }),
        createEmbeddings: async () => ({
          data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
        }),
      };

      mockLlmFactory = (token, model) => {
        assert.strictEqual(model, mockConfig.model);
        return mockCopilot;
      };
    });

    test("constructor stores llmFactory and memoryClient", () => {
      const service = new LlmService(
        mockConfig,
        mockMemoryClient,
        mockLlmFactory,
      );

      // Test that constructor succeeds - actual validation happens at usage time
      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("creates service instance with valid parameters", () => {
      const service = new LlmService(
        mockConfig,
        mockMemoryClient,
        mockLlmFactory,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("CreateCompletions requires resource_id", async () => {
      const service = new LlmService(
        mockConfig,
        mockMemoryClient,
        mockLlmFactory,
      );

      await assert.rejects(
        async () => {
          await service.CreateCompletions({
            github_token: "test-token",
            messages: [{ role: "user", content: "Hello" }],
            tools: [],
            temperature: 0.7,
          });
        },
        { message: "resource_id is required for CreateCompletions" },
      );
    });

    test("CreateCompletions fetches memory window when resource_id provided", async () => {
      let memoryWindowCalled = false;
      const mockMemoryClientWithTracking = {
        GetWindow: async (req) => {
          memoryWindowCalled = true;
          assert.ok(req.resource_id);
          assert.ok(req.model);
          return {
            messages: [{ role: "system", content: "You are an assistant" }],
            tools: [],
            temperature: "0.7",
          };
        },
      };

      const service = new LlmService(
        mockConfig,
        mockMemoryClientWithTracking,
        mockLlmFactory,
      );

      const result = await service.CreateCompletions({
        github_token: "test-token",
        resource_id: "test-conversation-id",
      });

      assert.ok(result);
      assert.ok(memoryWindowCalled, "Memory window should be fetched");
    });

    test("CreateEmbeddings processes chunks correctly", async () => {
      const service = new LlmService(
        mockConfig,
        mockMemoryClient,
        mockLlmFactory,
      );

      const result = await service.CreateEmbeddings({
        github_token: "test-token",
        input: ["test chunk"],
      });

      assert.ok(result);
      assert.ok(result.data);
      assert.strictEqual(result.data.length, 1);
      assert.deepStrictEqual(result.data[0].embedding, [0.1, 0.2, 0.3]);
    });
  });
});
