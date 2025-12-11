/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { AgentHands } from "../hands.js";

describe("AgentHands", () => {
  let mockServiceCallbacks;
  let mockResourceIndex;

  beforeEach(() => {
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
        },
      ],
      put: () => {},
    };
  });

  test("constructor validates required parameters", () => {
    assert.throws(() => new AgentHands(), /callbacks is required/);

    assert.throws(
      () => new AgentHands(mockServiceCallbacks),
      /resourceIndex is required/,
    );
  });

  test("constructor creates instance with valid parameters", () => {
    const agentHands = new AgentHands(mockServiceCallbacks, mockResourceIndex);
    assert.ok(agentHands instanceof AgentHands);
  });

  test("executeToolCall handles successful tool execution", async () => {
    const agentHands = new AgentHands(mockServiceCallbacks, mockResourceIndex);

      const toolCall = {
        id: "test-call",
        function: { name: "search" },
      };

    const message = await agentHands.executeToolCall(toolCall, "test-token");

    assert.ok(message);
    assert.strictEqual(message.role, "tool");
    assert.strictEqual(message.tool_call_id, "test-call");
  });

  test("executeToolCall handles tool execution errors", async () => {
    const mockCallbacksWithError = {
      ...mockServiceCallbacks,
      tool: {
        call: async () => {
          throw new Error("Tool execution failed");
        },
      },
    };

    const agentHands = new AgentHands(
      mockCallbacksWithError,
      mockResourceIndex,
    );

    const toolCall = {
      id: "test-call",
      function: { name: "search" },
    };

    const message = await agentHands.executeToolCall(toolCall, "test-token");

    assert.ok(message);
    assert.strictEqual(message.role, "tool");
    const content = JSON.parse(message.content);
    assert.strictEqual(content.error.message, "Tool execution failed");
  });

  test("processToolCalls processes tool calls and saves results", async () => {
    const agentHands = new AgentHands(mockServiceCallbacks, mockResourceIndex);

    const toolCalls = [
      { id: "call1", function: { name: "search" } },
      { id: "call2", function: { name: "analyze" } },
    ];

    const savedMessages = [];
    const saveResource = async (msg) => {
      savedMessages.push(msg);
    };

    await agentHands.processToolCalls(toolCalls, saveResource, {
      githubToken: "test-token",
    });

    // Should save 2 tool result messages
    assert.strictEqual(savedMessages.length, 2);
    assert.strictEqual(savedMessages[0].role, "tool");
    assert.strictEqual(savedMessages[1].role, "tool");
  });

  test("executeToolLoop passes resource_id to LLM and handles completion without tool calls", async () => {
    let capturedRequest = null;
    const mockCallbacksWithCapture = {
      ...mockServiceCallbacks,
      llm: {
        createCompletions: async (req) => {
          capturedRequest = req;
          return {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Test response",
                  tool_calls: [],
                },
              },
            ],
          };
        },
      };

    const agentHands = new AgentHands(
      mockCallbacksWithCapture,
      mockResourceIndex,
    );

    const savedMessages = [];
    const saveResource = async (msg) => {
      savedMessages.push(msg);
    };

    await agentHands.executeToolLoop("test-conversation-id", saveResource, {
      githubToken: "test-token",
      model: "gpt-4o",
    });

    // Should save the final assistant message
    assert.strictEqual(savedMessages.length, 1);
    assert.strictEqual(savedMessages[0].role, "assistant");

    // Verify resource_id was passed to LLM service
    assert.strictEqual(capturedRequest.resource_id, "test-conversation-id");
    assert.strictEqual(capturedRequest.github_token, "test-token");
  });

  test("executeToolLoop handles completion with tool calls", async () => {
    // Mock LLM to return tool calls on first iteration, then stop
    let iteration = 0;
    const mockCallbacksWithIterations = {
      ...mockServiceCallbacks,
      llm: {
        createCompletions: async () => {
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
                finish_reason: "stop",
                message: {
                  role: "assistant",
                  content: "Final response",
                  tool_calls: [],
                },
              },
            ],
          };
        },
      },
    };

    const agentHands = new AgentHands(
      mockCallbacksWithIterations,
      mockResourceIndex,
    );

    const savedMessages = [];
    const saveResource = async (msg) => {
      savedMessages.push(msg);
    };

    await agentHands.executeToolLoop("test-conversation", saveResource, {
      githubToken: "test-token",
      model: "gpt-4o",
    });

    // Should save: assistant with tool_calls, tool result, final assistant
    assert.strictEqual(savedMessages.length, 3);
    assert.strictEqual(savedMessages[0].role, "assistant");
    assert.strictEqual(savedMessages[1].role, "tool");
    assert.strictEqual(savedMessages[2].role, "assistant");
  });

  test("processToolCalls decrements budget after each tool call", async () => {
    const capturedMaxTokens = [];

    const mockCallbacksWithCapture = {
      ...mockServiceCallbacks,
      tool: {
        call: async (toolCall) => {
          capturedMaxTokens.push(toolCall.filter?.max_tokens);
          // Return string content so token counting works
          return {
            content: "x".repeat(1000), // ~1000 tokens of content
          };
        },
      },
    };

    const agentHands = new AgentHands(
      mockCallbacksWithCapture,
      mockResourceIndex,
    );

    const toolCalls = [
      { id: "call1", function: { name: "search" } },
      { id: "call2", function: { name: "analyze" } },
      { id: "call3", function: { name: "summarize" } },
    ];

    const savedMessages = [];
    const saveResource = async (msg) => {
      // Call withIdentifier to compute tokens like real code does
      msg.withIdentifier();
      savedMessages.push(msg);
    };

    await agentHands.processToolCalls(toolCalls, saveResource, {
      githubToken: "test-token",
      maxTokens: 5000,
    });

    // First call should get full budget (5000)
    assert.strictEqual(capturedMaxTokens[0], "5000");

    // Get actual tokens from first message to verify decrement
    const firstTokens = savedMessages[0].id.tokens;

    // Second call should get budget minus first call's tokens
    const expectedSecond = String(5000 - firstTokens);
    assert.strictEqual(capturedMaxTokens[1], expectedSecond);

    // Third call should get budget minus first two calls' tokens
    const secondTokens = savedMessages[1].id.tokens;
    const expectedThird = String(5000 - firstTokens - secondTokens);
    assert.strictEqual(capturedMaxTokens[2], expectedThird);
  });

  test("processToolCalls returns total tokens used", async () => {
    const mockCallbacksWithContent = {
      ...mockServiceCallbacks,
      tool: {
        call: async () => ({
          // Return string content that will be tokenized
          content: "This is test content for token counting",
        }),
      },
    };

    const agentHands = new AgentHands(
      mockCallbacksWithContent,
      mockResourceIndex,
    );

    const toolCalls = [
      { id: "call1", function: { name: "search" } },
      { id: "call2", function: { name: "analyze" } },
    ];

    const savedMessages = [];
    const saveResource = async (msg) => {
      // Call withIdentifier to compute tokens
      msg.withIdentifier();
      savedMessages.push(msg);
    };

    const totalTokens = await agentHands.processToolCalls(
      toolCalls,
      saveResource,
      {
        githubToken: "test-token",
        maxTokens: 10000,
      },
    );

    // Total should equal sum of individual message tokens
    const expectedTotal = savedMessages.reduce(
      (sum, msg) => sum + (msg.id?.tokens || 0),
      0,
    );
    assert.strictEqual(totalTokens, expectedTotal);
    assert.ok(totalTokens > 0, "Should have counted some tokens");
  });
});
