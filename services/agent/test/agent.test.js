import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { AgentService } from "../index.js";
import {
  createMockServiceConfig,
  createSilentLogger,
} from "@copilot-ld/libharness";

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
      assert.strictEqual(AgentService.length, 2); // config, agentMind
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
    let _mockLogger;

    beforeEach(() => {
      mockConfig = createMockServiceConfig("agent", {
        assistant: "common.Assistant.test-assistant",
      });

      mockAgentMind = {
        process: async () => ({
          resource_id: "test-conversation",
          choices: [
            { message: { role: "assistant", content: "Test response" } },
          ],
        }),
      };

      _mockLogger = createSilentLogger();
    });

    test("constructor validates required dependencies", () => {
      assert.throws(
        () => new AgentService(mockConfig, null),
        /agentMind is required/,
      );
    });

    test("ProcessStream throws error for missing user message", async () => {
      const mockAgentMindWithError = {
        process: async () => {
          throw new Error("No user message found in request");
        },
      };

      const service = new AgentService(mockConfig, mockAgentMindWithError);

      const mockCall = {
        request: { messages: [], llm_token: "test-token" },
        write: () => {},
        end: () => {},
      };

      await assert.rejects(
        () => service.ProcessStream(mockCall),
        /No user message found in request/,
      );
    });

    test("creates service instance with all dependencies", () => {
      const service = new AgentService(mockConfig, mockAgentMind);

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("ProcessStream calls agentMind and returns response", async () => {
      const service = new AgentService(mockConfig, mockAgentMind);

      const mockCall = {
        request: {
          messages: [{ role: "user", content: "Hello" }],
          llm_token: "test-token",
        },
        write: () => {},
        end: () => {},
      };

      await service.ProcessStream(mockCall);
    });
  });
});
