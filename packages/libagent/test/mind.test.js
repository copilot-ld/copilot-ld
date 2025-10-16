/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { AgentMind } from "../mind.js";

describe("AgentMind", () => {
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
              message: {
                role: "assistant",
                content: "Test response",
                tool_calls: [],
                id: { name: "test-response" },
                withIdentifier: () => {},
              },
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

  test("constructor validates required parameters", () => {
    assert.throws(() => new AgentMind(), /config is required/);

    assert.throws(() => new AgentMind(mockConfig), /callbacks is required/);

    assert.throws(
      () => new AgentMind(mockConfig, mockServiceCallbacks),
      /resourceIndex is required/,
    );
  });

  test("constructor creates instance with valid parameters", () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

    assert.ok(agentMind instanceof AgentMind);
  });

  test("calculateBudget adjusts budget based on resources", () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

    const assistant = { content: { tokens: 100 } };
    const permanentTools = [
      { descriptor: { tokens: 50 } },
      { descriptor: { tokens: 30 } },
    ];
    const tasks = [{ descriptor: { tokens: 20 } }];

    const budget = agentMind.calculateBudget(assistant, permanentTools, tasks);

    // 1000 - 100 (assistant) - 50 - 30 (tools) - 20 (tasks) = 800
    assert.strictEqual(budget, 800);
  });

  test("calculateBudget handles missing descriptor tokens", () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

    const assistant = { content: { tokens: 100 } };
    const permanentTools = [
      { descriptor: {} }, // Missing tokens
      { descriptor: { tokens: 30 } },
    ];
    const tasks = [];

    const budget = agentMind.calculateBudget(assistant, permanentTools, tasks);

    // 1000 - 100 (assistant) - 0 (missing) - 30 (tool) = 870
    assert.strictEqual(budget, 870);
  });

  test("buildMessages creates proper message array", async () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

    // Mock resource index to return specific items
    mockResourceIndex.get = async (actor, identifiers) => {
      if (!identifiers || identifiers.length === 0) return [];
      return identifiers.map((id) => ({ id, type: "mock" }));
    };

    const assistant = { id: { name: "test-assistant" } };
    const tasks = [{ id: { name: "test-task" } }];
    const window = {
      tools: ["tool1", "tool2"],
      context: ["context1"],
      history: ["history1", "history2"],
    };

    const messages = await agentMind.buildMessages(assistant, tasks, window);

    // Should include: assistant + tasks + tools + context + history
    assert.strictEqual(messages.length, 7);
    assert.deepStrictEqual(messages[0], assistant);
    assert.deepStrictEqual(messages[1], tasks[0]);
  });

  test("buildMessages throws error when assistant is missing", async () => {
    const agentMind = new AgentMind(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
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
    );

    // Mock setupConversation to return valid data
    agentMind.setupConversation = async () => ({
      conversation: {
        id: {
          name: "test-conv",
          toString: () => "test-conv",
        },
      },
      message: { id: { name: "test-msg" } },
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
