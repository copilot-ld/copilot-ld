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

    test("AgentService has ProcessStream method", () => {
      assert.strictEqual(
        typeof AgentService.prototype.ProcessStream,
        "function",
      );
    });

    test("AgentService has ProcessUnary method", () => {
      assert.strictEqual(
        typeof AgentService.prototype.ProcessUnary,
        "function",
      );
    });

    test("AgentService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(AgentService.length, 3); // config, agentMind, octokitFn
    });

    test("AgentService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(AgentService.prototype);
      assert(methods.includes("ProcessStream"));
      assert(methods.includes("ProcessUnary"));
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
        budget: 1000,
        threshold: 0.3,
        limit: 10,
        temperature: 0.7,
      };

      mockAgentMind = {
        process: async () => ({
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

    test("ProcessStream throws error for missing user message", async () => {
      const mockAgentMindWithError = {
        process: async () => {
          throw new Error("No user message found in request");
        },
      };

      const service = new AgentService(
        mockConfig,
        mockAgentMindWithError,
        mockOctokitFactory,
        () => ({ debug: () => {}, info: () => {}, error: () => {} }), // Mock logger
      );

      const mockCall = {
        request: { messages: [], github_token: "test-token" },
        write: () => {},
        end: () => {},
      };

      await assert.rejects(
        () => service.ProcessStream(mockCall),
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

    test("ProcessStream calls agentMind and returns response", async () => {
      const service = new AgentService(
        mockConfig,
        mockAgentMind,
        mockOctokitFactory,
        () => ({ debug: () => {}, info: () => {}, error: () => {} }),
      );

      const mockCall = {
        request: {
          messages: [{ role: "user", content: "Hello" }],
          github_token: "test-token",
        },
        write: () => {},
        end: () => {},
      };

      await service.ProcessStream(mockCall);
    });
  });
});
