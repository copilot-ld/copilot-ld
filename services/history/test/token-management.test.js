/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Mock NodeCache
class MockNodeCache {
  constructor() {
    this.data = new Map();
  }

  get(key) {
    return this.data.get(key);
  }

  set(key, value) {
    this.data.set(key, value);
    return true;
  }
}

// Mock LLM with countTokens and createCompletions methods
const mockLlm = {
  countTokens: mock.fn((text) => text.length), // Simple mock: 1 token per character
  createCompletions: mock.fn(
    async ({ messages: _messages, max_tokens: _max_tokens }) => {
      // Mock completion response for summarization
      return {
        choices: [
          {
            message: {
              content: "Summary of conversation", // 25 characters/tokens
            },
          },
        ],
      };
    },
  ),
};

// Mock LLM factory that returns our mock LLM
const mockLlmFactory = mock.fn(() => mockLlm);

// Mock gRPC factory to avoid grpc dependencies in tests
const mockGrpcFactory = () => ({
  grpc: {},
  protoLoader: {},
});

// Mock auth factory to avoid environment variable requirements
const mockAuthFactory = () => ({
  intercept: () => {},
  validateCall: () => ({ isValid: true }),
  createClientInterceptor: () => {},
});

// Import the actual service
import { HistoryService } from "../index.js";

describe("History Service Token Management", () => {
  let historyService;
  let mockCache;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      historyTokens: 100, // Small limit for testing
      name: "history", // Required by Service class
    };

    mockCache = new MockNodeCache();

    historyService = new HistoryService(
      mockConfig,
      mockCache,
      mockLlmFactory,
      mockGrpcFactory,
      mockAuthFactory,
    );

    // Reset mocks
    mockLlm.countTokens.mockRestore?.();
    mockLlm.countTokens = mock.fn((text) => text.length);
    mockLlm.createCompletions.mockRestore?.();
    mockLlm.createCompletions = mock.fn(
      async ({ messages: _messages, max_tokens: _max_tokens }) => {
        return {
          choices: [
            {
              message: {
                content: "Summary of conversation", // 25 characters/tokens
              },
            },
          ],
        };
      },
    );
    mockLlmFactory.mockRestore?.();
  });

  test("GetHistory returns all messages when no max_tokens specified", async () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ];

    mockCache.set("session1", {
      messages,
      tokens: [11, 16], // "user: Hello" = 11, "assistant: Hi there!" = 16
      totalTokens: 27,
    });

    const result = await historyService.GetHistory({ session_id: "session1" });

    assert.strictEqual(result.messages.length, 2);
    assert.deepStrictEqual(result.messages, messages);
  });

  test("GetHistory respects max_tokens limit", async () => {
    const messages = [
      { role: "user", content: "Hello" }, // 11 tokens
      { role: "assistant", content: "Hi there!" }, // 16 tokens
      { role: "user", content: "How are you?" }, // 18 tokens
    ];

    mockCache.set("session1", {
      messages,
      tokens: [11, 16, 18],
      totalTokens: 45,
    });

    // Request only 30 tokens - should get last 2 messages (16 + 18 = 34 > 30, so just last message)
    const result = await historyService.GetHistory({
      session_id: "session1",
      max_tokens: 30,
    });

    assert.strictEqual(result.messages.length, 1);
    assert.strictEqual(result.messages[0].content, "How are you?");
  });

  test("GetHistory returns messages in correct order (most recent within limit)", async () => {
    const messages = [
      { role: "user", content: "A" }, // 7 tokens
      { role: "assistant", content: "B" }, // 13 tokens
      { role: "user", content: "C" }, // 7 tokens
    ];

    mockCache.set("session1", {
      messages,
      tokens: [7, 13, 7],
      totalTokens: 27,
    });

    // Request 20 tokens - should get last 2 messages (13 + 7 = 20)
    const result = await historyService.GetHistory({
      session_id: "session1",
      max_tokens: 20,
    });

    assert.strictEqual(result.messages.length, 2);
    assert.strictEqual(result.messages[0].content, "B");
    assert.strictEqual(result.messages[1].content, "C");
  });

  test("UpdateHistory stores token counts with messages", async () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi!" },
    ];

    const result = await historyService.UpdateHistory({
      session_id: "session1",
      messages,
      github_token: "test-token", // Provide github_token for LLM creation
    });

    assert.strictEqual(result.success, true);

    const stored = mockCache.get("session1");
    assert.strictEqual(stored.messages.length, 2);
    assert.strictEqual(stored.tokens.length, 2);
    assert.strictEqual(stored.tokens[0], 11); // "user: Hello"
    assert.strictEqual(stored.tokens[1], 14); // "assistant: Hi!"
    assert.strictEqual(stored.totalTokens, 25);
  });

  test("UpdateHistory triggers summarization when token limit exceeded", async () => {
    // Create messages that exceed the 100 token limit
    const messages = [
      {
        role: "user",
        content: "This is a very long message that will exceed token limits",
      }, // ~65 tokens
      {
        role: "assistant",
        content: "This is also a long response that adds more tokens",
      }, // ~59 tokens
      { role: "user", content: "Short" }, // ~11 tokens
    ];
    // Total would be ~135 tokens, exceeding limit of 100

    const result = await historyService.UpdateHistory({
      session_id: "session1",
      messages,
      github_token: "test-token", // Provide github_token for LLM creation
    });

    assert.strictEqual(result.success, true);

    const stored = mockCache.get("session1");

    // Should have been summarized - fewer messages than input
    assert(stored.messages.length < messages.length);

    // Should have a summary message at the beginning
    assert.strictEqual(stored.messages[0].role, "system");
    assert(
      stored.messages[0].content.includes("Previous conversation summary"),
    );

    // Should keep the most recent message
    assert.strictEqual(
      stored.messages[stored.messages.length - 1].content,
      "Short",
    );

    // Total tokens should be within limit
    assert(stored.totalTokens <= 100);
  });

  test("UpdateHistory handles empty messages gracefully", async () => {
    const result = await historyService.UpdateHistory({
      session_id: "session1",
      messages: [],
      github_token: "test-token", // Provide github_token for LLM creation
    });

    assert.strictEqual(result.success, true);

    const stored = mockCache.get("session1");
    assert.strictEqual(stored.messages.length, 0);
    assert.strictEqual(stored.tokens.length, 0);
    assert.strictEqual(stored.totalTokens, 0);
  });

  test("Token counting calls Copilot.countTokens correctly", async () => {
    const messages = [{ role: "user", content: "Test message" }];

    await historyService.UpdateHistory({
      session_id: "session1",
      messages,
      github_token: "test-token", // Provide github_token for LLM creation
    });

    // Should have called countTokens with the full message
    assert.strictEqual(mockLlm.countTokens.mock.callCount(), 1);
    assert.strictEqual(
      mockLlm.countTokens.mock.calls[0].arguments[0],
      "user: Test message",
    );
  });
});
