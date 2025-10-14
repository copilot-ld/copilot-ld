/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { AgentService } from "../index.js";

describe("agent service", () => {
  describe("AgentService", () => {
    test("exports AgentService class", () => {
      assert.strictEqual(typeof AgentService, "function");
      assert.ok(AgentService.prototype);
    });

    test("AgentService has ProcessRequest method", () => {
      assert.strictEqual(
        typeof AgentService.prototype.ProcessRequest,
        "function",
      );
    });

    test("AgentService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(AgentService.length, 7); // config, memoryClient, llmClient, toolClient, resourceIndex, octokitFactory, logFn
    });

    test("AgentService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(AgentService.prototype);
      assert(methods.includes("ProcessRequest"));
      assert(methods.includes("constructor"));
    });
  });

  describe("AgentService business logic", () => {
    let mockConfig;
    let mockMemoryClient;
    let mockLlmClient;
    let mockToolClient;
    let mockResourceIndex;
    let mockOctokitFactory;

    beforeEach(() => {
      mockConfig = {
        name: "agent", // Required for logging
        assistant: "common.Assistant.test-assistant",
        budget: {
          tokens: 1000,
          allocation: { tools: 0.2, history: 0.5, context: 0.3 },
        },
        threshold: 0.3,
        limit: 10,
        temperature: 0.7,
      };

      mockMemoryClient = {
        Append: async () => ({ accepted: "test-conversation" }),
        Get: async () => ({
          tools: [],
          context: [],
          history: [],
        }),
      };

      mockLlmClient = {
        CreateEmbeddings: async () => ({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
        CreateCompletions: async () => ({
          choices: [
            { message: { role: "assistant", content: "Test response" } },
          ],
          usage: { total_tokens: 100 },
        }),
      };

      mockToolClient = {
        Call: async () => ({ result: "test result" }),
      };

      mockResourceIndex = {
        get: async () => [{ content: { tokens: 50 } }],
        put: () => {},
      };

      mockOctokitFactory = () => ({
        request: async () => ({ login: "test-user" }),
      });
    });

    test("constructor validates required dependencies", () => {
      assert.throws(
        () =>
          new AgentService(
            mockConfig,
            null,
            mockLlmClient,
            mockToolClient,
            mockResourceIndex,
            mockOctokitFactory,
          ),
        /memoryClient is required/,
      );

      assert.throws(
        () =>
          new AgentService(
            mockConfig,
            mockMemoryClient,
            null,
            mockToolClient,
            mockResourceIndex,
            mockOctokitFactory,
          ),
        /llmClient is required/,
      );

      assert.throws(
        () =>
          new AgentService(
            mockConfig,
            mockMemoryClient,
            mockLlmClient,
            null,
            mockResourceIndex,
            mockOctokitFactory,
          ),
        /toolClient is required/,
      );
    });

    test("ProcessRequest throws error for missing user message", async () => {
      const service = new AgentService(
        mockConfig,
        mockMemoryClient,
        mockLlmClient,
        mockToolClient,
        mockResourceIndex,
        mockOctokitFactory,
        () => ({ debug: () => {}, info: () => {}, error: () => {} }), // Mock logger
      );

      await assert.rejects(
        () =>
          service.ProcessRequest({ messages: [], github_token: "test-token" }),
        /No user message found in request/,
      );
    });

    test("creates service instance with all dependencies", () => {
      const service = new AgentService(
        mockConfig,
        mockMemoryClient,
        mockLlmClient,
        mockToolClient,
        mockResourceIndex,
        mockOctokitFactory,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });
  });
});
