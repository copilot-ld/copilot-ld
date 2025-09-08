/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

import { LlmService } from "../index.js";

describe("LlmService", () => {
  let mockConfig;
  let mockLlmFactory;
  let mockLlm;
  let mockLogFn;

  beforeEach(() => {
    mockConfig = {
      name: "llm",
      model: "gpt-4",
      maxTokens: 4000,
      temperature: 0.7,
    };

    mockLlm = {
      createCompletions: mock.fn(),
      createEmbeddings: mock.fn(),
    };

    mockLlmFactory = mock.fn(() => mockLlm);

    mockLogFn = mock.fn(() => ({
      debug: mock.fn(),
    }));
  });

  test("should require config parameter", () => {
    assert.throws(
      () => new LlmService(null, mockLlmFactory),
      /config is required/,
    );
  });

  test("should create instance with valid parameters", () => {
    const service = new LlmService(mockConfig, mockLlmFactory, mockLogFn);

    assert.ok(service);
    assert.strictEqual(service.config, mockConfig);
  });

  test("should use default log factory when not provided", () => {
    const service = new LlmService(mockConfig, mockLlmFactory);

    assert.ok(service);
    assert.ok(typeof service.debug === "function");
  });

  describe("CreateCompletions", () => {
    test("should create completions successfully", async () => {
      const mockResponse = {
        id: "chatcmpl-test",
        object: "chat.completion",
        created: Date.now(),
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "This is a test response",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 10,
          total_tokens: 30,
        },
      };

      mockLlm.createCompletions.mock.mockImplementation(() =>
        Promise.resolve(mockResponse),
      );

      const service = new LlmService(mockConfig, mockLlmFactory, mockLogFn);

      const request = {
        messages: [
          {
            role: "user",
            content: "Hello, how are you?",
          },
        ],
        github_token: "test-token",
      };

      const response = await service.CreateCompletions(request);

      assert.strictEqual(mockLlmFactory.mock.callCount(), 1);
      assert.deepStrictEqual(mockLlmFactory.mock.calls[0].arguments, [
        "test-token",
        "gpt-4",
      ]);

      assert.strictEqual(mockLlm.createCompletions.mock.callCount(), 1);
      assert.strictEqual(response.id, "chatcmpl-test");
      assert.strictEqual(
        response.choices[0].message.content.text,
        "This is a test response",
      );
      assert.strictEqual(response.usage.total_tokens, 30);
    });

    test("should handle empty messages array", async () => {
      const mockResponse = {
        id: "chatcmpl-empty",
        choices: [
          {
            message: { role: "assistant", content: "" },
          },
        ],
        usage: { total_tokens: 0 },
      };

      mockLlm.createCompletions.mock.mockImplementation(() =>
        Promise.resolve(mockResponse),
      );

      const service = new LlmService(mockConfig, mockLlmFactory);

      const response = await service.CreateCompletions({
        messages: [],
        github_token: "test-token",
      });

      assert.ok(response);
      assert.strictEqual(response.id, "chatcmpl-empty");
    });

    test("should propagate LLM errors", async () => {
      const error = new Error("API rate limit exceeded");
      mockLlm.createCompletions.mock.mockImplementation(() =>
        Promise.reject(error),
      );

      const service = new LlmService(mockConfig, mockLlmFactory);

      await assert.rejects(
        () =>
          service.CreateCompletions({
            messages: [{ role: "user", content: "test" }],
            github_token: "test-token",
          }),
        /API rate limit exceeded/,
      );
    });
  });

  describe("CreateEmbeddings", () => {
    test("should create embeddings successfully", async () => {
      const mockEmbeddings = [
        { embedding: [0.1, 0.2, 0.3], index: 0 },
        { embedding: [0.4, 0.5, 0.6], index: 1 },
      ];

      mockLlm.createEmbeddings.mock.mockImplementation(() =>
        Promise.resolve(mockEmbeddings),
      );

      const service = new LlmService(mockConfig, mockLlmFactory, mockLogFn);

      const request = {
        chunks: ["Hello world", "Test text"],
        github_token: "test-token",
      };

      const response = await service.CreateEmbeddings(request);

      assert.strictEqual(mockLlmFactory.mock.callCount(), 1);
      assert.deepStrictEqual(mockLlmFactory.mock.calls[0].arguments, [
        "test-token",
        "gpt-4",
      ]);

      assert.strictEqual(mockLlm.createEmbeddings.mock.callCount(), 1);
      assert.deepStrictEqual(mockLlm.createEmbeddings.mock.calls[0].arguments, [
        ["Hello world", "Test text"],
      ]);

      assert.strictEqual(response.data.length, 2);
      assert.deepStrictEqual(response.data[0].embedding, [0.1, 0.2, 0.3]);
      assert.strictEqual(response.data[0].index, 0);
    });

    test("should handle empty chunks array", async () => {
      mockLlm.createEmbeddings.mock.mockImplementation(() =>
        Promise.resolve([]),
      );

      const service = new LlmService(mockConfig, mockLlmFactory);

      const response = await service.CreateEmbeddings({
        chunks: [],
        github_token: "test-token",
      });

      assert.ok(response);
      assert.strictEqual(response.data.length, 0);
    });

    test("should propagate embedding errors", async () => {
      const error = new Error("Invalid input text");
      mockLlm.createEmbeddings.mock.mockImplementation(() =>
        Promise.reject(error),
      );

      const service = new LlmService(mockConfig, mockLlmFactory);

      await assert.rejects(
        () =>
          service.CreateEmbeddings({
            chunks: ["test"],
            github_token: "test-token",
          }),
        /Invalid input text/,
      );
    });
  });

  describe("Service Interface", () => {
    test("should return correct proto name", () => {
      const service = new LlmService(mockConfig, mockLlmFactory);

      assert.strictEqual(service.getProtoName(), "llm.proto");
    });

    test("should return handlers map", () => {
      const service = new LlmService(mockConfig, mockLlmFactory);

      const handlers = service.getHandlers();

      assert.ok(handlers);
      assert.ok(typeof handlers.CreateCompletions === "function");
      assert.ok(typeof handlers.CreateEmbeddings === "function");
    });

    test("handlers should call service methods", async () => {
      mockLlm.createCompletions.mock.mockImplementation(() =>
        Promise.resolve({ choices: [] }),
      );

      const service = new LlmService(mockConfig, mockLlmFactory);
      const handlers = service.getHandlers();

      const mockCall = {
        request: {
          messages: [{ role: "user", content: "test" }],
          github_token: "token",
        },
      };

      await handlers.CreateCompletions(mockCall);

      assert.strictEqual(mockLlm.createCompletions.mock.callCount(), 1);
    });
  });

  describe("Debug Logging", () => {
    test("should log debug messages when logger provided", () => {
      const mockLogger = { debug: mock.fn() };
      const logFn = mock.fn(() => mockLogger);

      const service = new LlmService(mockConfig, mockLlmFactory, logFn);

      service.debug("test message", { context: "test" });

      assert.strictEqual(logFn.mock.callCount(), 1);
      assert.strictEqual(logFn.mock.calls[0].arguments[0], "llm");
      assert.strictEqual(mockLogger.debug.mock.callCount(), 1);
      assert.strictEqual(
        mockLogger.debug.mock.calls[0].arguments[0],
        "test message",
      );
    });
  });
});
