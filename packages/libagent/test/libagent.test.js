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
      assistant: "software_dev_expert",
    };

    mockServiceCallbacks = {
      memory: {
        append: async () => ({}),
        getBudget: async () => ({
          total: 128000,
          overhead: 5000,
          available: 123000,
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

    const agentHands = new AgentHands(mockServiceCallbacks, mockResourceIndex);
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
    const agentHands = new AgentHands(mockServiceCallbacks, mockResourceIndex);
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      agentHands,
    );

    // Mock setupConversation to return valid data
    agentMind.setupConversation = async () => ({
      conversation: common.Conversation.fromObject({
        id: {
          name: "test-conv",
          type: "common.Conversation",
        },
        assistant_id: "common.Assistant.test",
      }),
      message: common.Message.fromObject({
        id: {
          name: "test-msg",
          type: "common.Message",
        },
        role: "user",
        content: "Hello",
      }),
    });

    const request = {
      github_token: "test-token",
      messages: [{ role: "user", content: "Hello" }],
    };

    // process now returns void - just verify it completes without error
    await agentMind.process(request);

    // Test passes if no error was thrown
    assert.ok(true);
  });
});
