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
      assert.strictEqual(AgentService.length, 8); // config, memoryClient, llmClient, vectorClient, toolClient, resourceIndex, octokitFactory, logFn
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
    let mockVectorClient;
    let mockToolClient;
    let mockResourceIndex;
    let mockOctokitFactory;

    beforeEach(() => {
      mockConfig = {
        name: "agent", // Required for logging
        assistant: { name: "test-assistant" },
        budget: {
          tokens: 1000,
          allocation: { tools: 0.2, history: 0.5, context: 0.3 },
        },
        threshold: 0.3,
        limit: 10,
        temperature: 0.7,
      };

      mockMemoryClient = {
        ensureReady: async () => {},
        Append: async () => ({ accepted: "test-conversation" }),
        GetWindow: async () => ({
          tools: [],
          context: [],
          history: [],
        }),
      };

      mockLlmClient = {
        ensureReady: async () => {},
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

      mockVectorClient = {
        ensureReady: async () => {},
        QueryItems: async () => ({ identifiers: [] }),
      };

      mockToolClient = {
        ensureReady: async () => {},
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
            mockVectorClient,
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
            mockVectorClient,
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
            mockToolClient,
            mockResourceIndex,
            mockOctokitFactory,
          ),
        /vectorClient is required/,
      );
    });

    test("ProcessRequest throws error for missing user message", async () => {
      const service = new AgentService(
        mockConfig,
        mockMemoryClient,
        mockLlmClient,
        mockVectorClient,
        mockToolClient,
        mockResourceIndex,
        mockOctokitFactory,
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
        mockVectorClient,
        mockToolClient,
        mockResourceIndex,
        mockOctokitFactory,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });
  });
});
