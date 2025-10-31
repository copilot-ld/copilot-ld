/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { AgentHands } from "../hands.js";

describe("AgentHands", () => {
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
          id: { name: "test-resource" },
          content: "Test content",
          descriptor: "Test descriptor",
        },
      ],
      put: () => {},
    };
  });

  test("constructor validates required parameters", () => {
    assert.throws(() => new AgentHands(), /config is required/);

    assert.throws(() => new AgentHands(mockConfig), /callbacks is required/);

    assert.throws(
      () => new AgentHands(mockConfig, mockServiceCallbacks),
      /resourceIndex is required/,
    );
  });

  test("constructor creates instance with valid parameters", () => {
    const agentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );
    assert.ok(agentHands instanceof AgentHands);
  });

  test("mergeTools combines permanent and remembered tools without duplicates", () => {
    const agentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

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
    const agentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

    const toolCall = {
      id: "test-call",
      function: { name: "search" },
    };

    const result = await agentHands.executeToolCall(
      "test-resource-id",
      toolCall,
      100,
      "test-token",
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.error, null);
    assert.ok(result.message);
  });

  test("executeToolCall handles tool execution errors", async () => {
    const agentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

    // Mock service callback to throw error
    mockServiceCallbacks.tool.call = async () => {
      throw new Error("Tool execution failed");
    };

    const toolCall = {
      id: "test-call",
      function: { name: "search" },
    };

    const result = await agentHands.executeToolCall(
      "test-resource-id",
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
    const agentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

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
      "test-resource-id",
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

  test("processToolCalls divides token budget across multiple tool calls", async () => {
    let capturedMaxTokens = [];

    const mockCallbacksWithCapture = {
      ...mockServiceCallbacks,
      tool: {
        call: async (toolDef) => {
          // Capture the max_tokens value passed to each tool call
          capturedMaxTokens.push(toolDef.filter?.max_tokens);
          return {
            role: "tool",
            content: "Tool result",
          };
        },
      },
    };

    const agentHands = new AgentHands(
      mockConfig,
      mockCallbacksWithCapture,
      mockResourceIndex,
    );

    const choiceWithToolCalls = {
      message: {
        role: "assistant",
        tool_calls: [
          { id: "call1", function: { name: "search" } },
          { id: "call2", function: { name: "analyze" } },
          { id: "call3", function: { name: "query" } },
        ],
      },
    };

    const messages = [];
    const maxTokens = 9000; // Will be divided by 3 tool calls = 3000 each

    await agentHands.processToolCalls(
      "test-resource-id",
      choiceWithToolCalls,
      messages,
      maxTokens,
      "test-token",
    );

    // Should add assistant message + 3 tool result messages
    assert.strictEqual(messages.length, 4);
    assert.strictEqual(messages[0].role, "assistant");
    assert.strictEqual(messages[1].role, "tool");
    assert.strictEqual(messages[2].role, "tool");
    assert.strictEqual(messages[3].role, "tool");

    // Verify token budget was divided equally across tool calls
    assert.strictEqual(capturedMaxTokens.length, 3);
    // Protobuf may convert to string, so check both numeric and string equality
    assert.ok(
      capturedMaxTokens[0] == 3000,
      `Expected 3000, got ${capturedMaxTokens[0]}`,
    );
    assert.ok(
      capturedMaxTokens[1] == 3000,
      `Expected 3000, got ${capturedMaxTokens[1]}`,
    );
    assert.ok(
      capturedMaxTokens[2] == 3000,
      `Expected 3000, got ${capturedMaxTokens[2]}`,
    );
  });

  test("executeToolLoop handles completion without tool calls", async () => {
    const agentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

    const messages = [{ role: "user", content: "Hello" }];
    const tools = [];

    const result = await agentHands.executeToolLoop(
      "test-resource-id",
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
    const agentHands = new AgentHands(
      mockConfig,
      mockServiceCallbacks,
      mockResourceIndex,
    );

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
      "test-resource-id",
      messages,
      tools,
      100,
      "test-token",
    );

    assert.ok(result.choices);
    assert.strictEqual(result.choices.length, 1);
  });
});
