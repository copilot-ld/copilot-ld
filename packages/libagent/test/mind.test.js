/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { AgentMind } from "../mind.js";
import { AgentHands } from "../hands.js";
import { common } from "@copilot-ld/libtype";

describe("AgentMind", () => {
  let mockConfig;
  let mockServiceCallbacks;
  let mockResourceIndex;
  let mockAgentHands;

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

    mockAgentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );
  });

  test("constructor validates required parameters", () => {
    assert.throws(() => new AgentMind(), /config is required/);

    assert.throws(() => new AgentMind(mockConfig), /callbacks is required/);

    assert.throws(
      () => new AgentMind(mockConfig, mockServiceCallbacks),
      /resourceIndex is required/,
    );

    assert.throws(
      () => new AgentMind(mockConfig, mockServiceCallbacks, mockResourceIndex),
      /agentHands is required/,
    );
  });

  test("constructor creates instance with valid parameters", () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      mockAgentHands,
    );

    assert.ok(agentMind instanceof AgentMind);
  });

  test("calculateBudget adjusts budget based on resources", () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      mockAgentHands,
    );

    const assistant = { id: { tokens: 100 } }; // 100 tokens
    const permanentTools = [
      { id: { tokens: 50 } }, // 50 tokens
      { id: { tokens: 30 } }, // 30 tokens
    ];
    const tasks = [{ id: { tokens: 20 } }]; // 20 tokens

    const budget = agentMind.calculateBudget(assistant, permanentTools, tasks);

    // Budget should be reduced by approximately 200 tokens
    assert.ok(budget < 1000);
    assert.ok(budget > 700);
  });

  test("calculateBudget handles empty content", () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      mockAgentHands,
    );

    const assistant = { id: { tokens: 100 } };
    const permanentTools = [
      { id: { tokens: 0 } }, // Empty content
      { id: { tokens: 30 } },
    ];
    const tasks = [];

    const budget = agentMind.calculateBudget(assistant, permanentTools, tasks);

    // Budget should still be reduced appropriately
    assert.ok(budget < 1000);
    assert.ok(budget > 800);
  });

  test("buildMessages creates proper message array", async () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      mockAgentHands,
    );

    // Mock resource index to return specific items
    mockResourceIndex.get = async (identifiers, _actor) => {
      if (!identifiers || identifiers.length === 0) return [];
      return identifiers.map((id) => ({ id, type: "mock" }));
    };

    const assistant = { id: { name: "test-assistant" } };
    const tasks = [{ id: { name: "test-task" } }];
    const window = {
      tools: ["tool1", "tool2"],
      context: ["context1"],
      conversation: ["conversation1", "conversation2"],
    };

    const messages = await agentMind.buildMessages(assistant, tasks, window);

    // Should include: assistant + tasks + tools + context + conversation
    assert.strictEqual(messages.length, 7);
    assert.deepStrictEqual(messages[0], assistant);
    assert.deepStrictEqual(messages[1], tasks[0]);
  });

  test("buildMessages throws error when assistant is missing", async () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      mockAgentHands,
    );

    await assert.rejects(
      () => agentMind.buildMessages(null, [], {}),
      /assistant is required/,
    );
  });

  test("buildTools converts function resources to tool definitions", async () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      mockAgentHands,
    );

    // Mock resource index to return tool functions
    mockResourceIndex.get = async () => [
      { id: { name: "search" }, name: "search" },
      { id: { name: "analyze" }, name: "analyze" },
    ];

    const identifiers = [
      "tool.ToolFunction.search",
      "tool.ToolFunction.analyze",
    ];
    const tools = await agentMind.buildTools(identifiers);

    assert.strictEqual(tools.length, 2);
    assert.strictEqual(tools[0].type, "function");
    assert.strictEqual(tools[1].type, "function");
  });

  test("processRequest handles complete workflow", async () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
      mockAgentHands,
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

    assert.ok(result.resource_id);
    assert.strictEqual(result.resource_id, "test-conv");
  });
});
