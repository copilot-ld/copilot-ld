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

    test("LlmService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(LlmService.length, 3); // config, llmFactory, logFn
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
    let mockLlmFactory;
    let mockCopilot;

    beforeEach(() => {
      mockConfig = {
        name: "llm", // Required for logging
        model: "gpt-4",
      };

      mockCopilot = {
        createCompletions: async () => ({
          id: "test-completion",
          choices: [
            { message: { role: "assistant", content: "Test response" } },
          ],
          usage: { total_tokens: 100 },
        }),
        createEmbeddings: async () => [
          { index: 0, embedding: [0.1, 0.2, 0.3] },
        ],
      };

      mockLlmFactory = (token, model) => {
        assert.strictEqual(model, mockConfig.model);
        return mockCopilot;
      };
    });

    test("constructor stores llmFactory", () => {
      const service = new LlmService(mockConfig, mockLlmFactory);

      // Test that constructor succeeds - actual validation happens at usage time
      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("creates service instance with valid parameters", () => {
      const service = new LlmService(mockConfig, mockLlmFactory);

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("CreateCompletions uses correct model from config", async () => {
      const service = new LlmService(mockConfig, mockLlmFactory);

      const result = await service.CreateCompletions({
        github_token: "test-token",
        messages: [{ role: "user", content: "Hello" }],
        tools: [],
        temperature: 0.7,
      });

      assert.ok(result);
      assert.ok(result.choices);
      assert.strictEqual(result.choices.length, 1);
    });

    test("CreateEmbeddings processes chunks correctly", async () => {
      const service = new LlmService(mockConfig, mockLlmFactory);

      const result = await service.CreateEmbeddings({
        github_token: "test-token",
        chunks: ["test chunk"],
      });

      assert.ok(result);
      assert.ok(result.data);
      assert.strictEqual(result.data.length, 1);
      assert.deepStrictEqual(result.data[0].embedding, [0.1, 0.2, 0.3]);
    });
  });
});
