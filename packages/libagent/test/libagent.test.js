/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { AgentMind, AgentHands } from "../index.js";
import { common } from "@copilot-ld/libtype";

describe("libagent", () => {
  let mockConfig;
  let mockServiceCallbacks;
  let mockResourceIndex;

  beforeEach(() => {
    mockConfig = {
      budget: {
        tokens: 1000,
        allocation: {
          tools: 0.3,
          history: 0.4,
          results: 0.3,
        },
      },
      assistant: "software_dev_expert",
      permanent_tools: ["search", "analyze"],
      temperature: 0.7,
      threshold: 0.5,
      limit: 10,
    };

    mockServiceCallbacks = {
      memory: {
        append: async () => ({}),
        get: async () => ({
          tools: [],
          context: [],
          history: [],
        }),
      },
      llm: {
        createCompletions: async () => ({
          choices: [
            {
              message: common.Message.fromObject({
                role: "assistant",
                content: "Test response",
                tool_calls: [],
              }),
            },
          ],
        }),
      },
      tool: {
        call: async () => ({
          role: "tool",
          content: "Tool result",
        }),
      },
    };

    mockResourceIndex = {
      get: async () => [
        {
          id: { name: "test-assistant" },
          content: { tokens: 100 },
        },
      ],
      put: () => {},
    };
  });

  test("AgentMind and AgentHands can be imported from main index", () => {
    assert.ok(AgentMind);
    assert.ok(AgentHands);

    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      agentHands,
    );

    assert.ok(agentMind instanceof AgentMind);
    assert.ok(agentHands instanceof AgentHands);
  });

  test("AgentMind and AgentHands work together in complete workflow", async () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      agentHands,
    );

    // Mock setupConversation to return valid data
    agentMind.setupConversation = async () => ({
      conversation: {
        id: {
          name: "test-conv",
          toString: () => "test-conv",
        },
      },
      message: {
        id: {
          name: "test-msg",
          type: "common.Message",
          toJSON: () => ({ name: "test-msg", type: "common.Message" }),
        },
      },
      assistant: { content: { tokens: 100 } },
      tasks: [],
      permanentTools: [],
    });

    // Mock getMemoryWindow
    agentMind.getMemoryWindow = async () => ({
      messages: [{ role: "user", content: "Hello" }],
      rememberedTools: [],
    });

    const request = {
      github_token: "test-token",
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = await agentMind.processRequest(request);

    assert.ok(result.conversation_id);
    assert.strictEqual(result.conversation_id, "test-conv");
  });
});
