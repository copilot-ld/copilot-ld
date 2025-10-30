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
      assert.strictEqual(AgentService.length, 4); // config, agentMind, octokitFactory, logFn
    });

    test("AgentService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(AgentService.prototype);
      assert(methods.includes("ProcessRequest"));
      assert(methods.includes("constructor"));
    });
  });

  describe("AgentService business logic", () => {
    let mockConfig;
    let mockAgentMind;
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

      mockAgentMind = {
        processRequest: async () => ({
          resource_id: "test-conversation",
          choices: [
            { message: { role: "assistant", content: "Test response" } },
          ],
        }),
      };

      mockOctokitFactory = () => ({
        request: async () => ({ login: "test-user" }),
      });
    });

    test("constructor validates required dependencies", () => {
      assert.throws(
        () => new AgentService(mockConfig, null, mockOctokitFactory),
        /agentMind is required/,
      );

      assert.throws(
        () => new AgentService(mockConfig, mockAgentMind, null),
        /octokitFn is required/,
      );
    });

    test("ProcessRequest throws error for missing user message", async () => {
      const mockAgentMindWithError = {
        processRequest: async () => {
          throw new Error("No user message found in request");
        },
      };

      const service = new AgentService(
        mockConfig,
        mockAgentMindWithError,
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
        mockAgentMind,
        mockOctokitFactory,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("ProcessRequest calls agentMind and returns response", async () => {
      const service = new AgentService(
        mockConfig,
        mockAgentMind,
        mockOctokitFactory,
        () => ({ debug: () => {}, info: () => {}, error: () => {} }),
      );

      const result = await service.ProcessRequest({
        messages: [{ role: "user", content: "Hello" }],
        github_token: "test-token",
      });

      assert.ok(result);
      assert.strictEqual(result.resource_id, "test-conversation");
    });
  });
});
