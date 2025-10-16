/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { AgentHands } from "../hands.js";

describe("AgentHands", () => {
  let mockConfig;
  let mockServiceCallbacks;

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
  });

  test("constructor validates required parameters", () => {
    assert.throws(() => new AgentHands(), /config is required/);

    assert.throws(
      () => new AgentHands(mockConfig),
      /serviceCallbacks is required/,
    );
  });

  test("constructor creates instance with valid parameters", () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);
    assert.ok(agentHands instanceof AgentHands);
  });

  test("mergeTools combines permanent and remembered tools without duplicates", () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);

    const permanentTools = [
      { id: { name: "search" }, type: "function" },
      { id: { name: "analyze" }, type: "function" },
    ];
    const rememberedTools = [
      { id: { name: "search" }, type: "function" }, // Duplicate
      { id: { name: "transform" }, type: "function" }, // New
    ];

    const merged = agentHands.mergeTools(permanentTools, rememberedTools);

    assert.strictEqual(merged.length, 3);
    assert.strictEqual(merged[0].id.name, "search");
    assert.strictEqual(merged[1].id.name, "analyze");
    assert.strictEqual(merged[2].id.name, "transform");
  });

  test("executeToolCall handles successful tool execution", async () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);

    const toolCall = {
      id: "test-call",
      function: { name: "search" },
    };

    const result = await agentHands.executeToolCall(
      toolCall,
      100,
      "test-token",
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.error, null);
    assert.ok(result.message);
  });

  test("executeToolCall handles tool execution errors", async () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);

    // Mock service callback to throw error
    mockServiceCallbacks.tool.call = async () => {
      throw new Error("Tool execution failed");
    };

    const toolCall = {
      id: "test-call",
      function: { name: "search" },
    };

    const result = await agentHands.executeToolCall(
      toolCall,
      100,
      "test-token",
    );

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, "Tool execution failed");
    assert.ok(result.message);
    assert.strictEqual(result.message.role, "tool");
  });

  test("processToolCalls adds messages and processes tool calls", async () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);

    const choiceWithToolCalls = {
      message: {
        role: "assistant",
        tool_calls: [
          { id: "call1", function: { name: "search" } },
          { id: "call2", function: { name: "analyze" } },
        ],
      },
    };

    const messages = [];
    await agentHands.processToolCalls(
      choiceWithToolCalls,
      messages,
      100,
      "test-token",
    );

    // Should add assistant message + 2 tool result messages
    assert.strictEqual(messages.length, 3);
    assert.strictEqual(messages[0].role, "assistant");
    assert.strictEqual(messages[1].role, "tool");
    assert.strictEqual(messages[2].role, "tool");
  });

  test("executeToolLoop handles completion without tool calls", async () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);

    const messages = [{ role: "user", content: "Hello" }];
    const tools = [];

    const result = await agentHands.executeToolLoop(
      messages,
      tools,
      100,
      "test-token",
    );

    assert.ok(result.choices);
    assert.strictEqual(result.choices.length, 1);
    assert.strictEqual(result.choices[0].message.role, "assistant");
  });

  test("executeToolLoop handles completion with tool calls", async () => {
    const agentHands = new AgentHands(mockConfig, mockServiceCallbacks);

    // Mock LLM to return tool calls on first iteration, then stop
    let iteration = 0;
    mockServiceCallbacks.llm.createCompletions = async () => {
      iteration++;
      if (iteration === 1) {
        return {
          choices: [
            {
              message: {
                role: "assistant",
                tool_calls: [{ id: "call1", function: { name: "search" } }],
              },
            },
          ],
        };
      }
      return {
        choices: [
          {
            message: {
              role: "assistant",
              content: "Final response",
              tool_calls: [],
            },
          },
        ],
      };
    };

    const messages = [{ role: "user", content: "Hello" }];
    const tools = [{ type: "function", function: { name: "search" } }];

    const result = await agentHands.executeToolLoop(
      messages,
      tools,
      100,
      "test-token",
    );

    assert.ok(result.choices);
    assert.strictEqual(result.choices.length, 1);
  });
});
