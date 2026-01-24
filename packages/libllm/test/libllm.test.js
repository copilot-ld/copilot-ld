import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { LlmApi, DEFAULT_BASE_URL } from "../index.js";
import { Retry } from "@copilot-ld/libutil";

describe("libllm", () => {
  describe("LlmApi", () => {
    let mockFetch;
    let llmApi;
    let retry;

    beforeEach(() => {
      mockFetch = mock.fn();
      retry = new Retry();
      llmApi = new LlmApi(
        "test-token",
        "gpt-4",
        DEFAULT_BASE_URL,
        retry,
        mockFetch,
      );
    });

    test("creates LlmApi with token and model", () => {
      assert.ok(llmApi instanceof LlmApi);
    });

    test("createCompletions makes correct API call", async () => {
      const mockResponse = {
        ok: true,
        json: mock.fn(() =>
          Promise.resolve({
            id: "test-id",
            object: "chat.completion",
            choices: [{ message: { role: "assistant", content: "Hello" } }],
            usage: { total_tokens: 10 },
          }),
        ),
      };
      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(mockResponse),
      );

      const messages = [{ role: "user", content: "Hello" }];
      const tools = undefined;
      const temperature = 0.5;
      const max_tokens = 100;

      const result = await llmApi.createCompletions(
        messages,
        tools,
        temperature,
        max_tokens,
      );

      assert.strictEqual(mockFetch.mock.callCount(), 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.strictEqual(url, `${DEFAULT_BASE_URL}/chat/completions`);
      assert.strictEqual(options.method, "POST");
      assert.ok(options.headers.Authorization.includes("test-token"));
      assert.strictEqual(result.id, "test-id");
    });

    test("createCompletions uses default model when not specified", async () => {
      const mockResponse = {
        ok: true,
        json: mock.fn(() =>
          Promise.resolve({
            id: "test-id",
            object: "chat.completion",
            choices: [],
            usage: { total_tokens: 10 },
          }),
        ),
      };
      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(mockResponse),
      );

      const messages = [{ role: "user", content: "Hello" }];

      await llmApi.createCompletions(messages);

      const [, options] = mockFetch.mock.calls[0].arguments;
      const body = JSON.parse(options.body);
      assert.strictEqual(body.model, "gpt-4");
    });

    test("createCompletions throws error on HTTP error", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: mock.fn(() => Promise.resolve("Error details")),
      };
      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(mockResponse),
      );

      const messages = [{ role: "user", content: "Hello" }];

      await assert.rejects(() => llmApi.createCompletions(messages), {
        message: /HTTP 404: Not Found/,
      });
    });

    test("createCompletions throws error immediately on non-429 HTTP error", async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: mock.fn(() => Promise.resolve("Server error details")),
      };

      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(errorResponse),
      );

      const messages = [{ role: "user", content: "Hello" }];

      await assert.rejects(() => llmApi.createCompletions(messages), {
        message: /HTTP 500: Internal Server Error/,
      });

      // Should not retry for non-429 errors
      assert.strictEqual(mockFetch.mock.callCount(), 1);
    });

    test("createEmbeddings makes correct API call", async () => {
      const mockResponse = {
        ok: true,
        json: mock.fn(() =>
          Promise.resolve({
            data: [
              { embedding: [0.1, 0.2, 0.3], index: 0 },
              { embedding: [0.4, 0.5, 0.6], index: 1 },
            ],
          }),
        ),
      };
      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(mockResponse),
      );

      const texts = ["Hello", "World"];
      const result = await llmApi.createEmbeddings(texts);

      assert.strictEqual(mockFetch.mock.callCount(), 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.strictEqual(url, `${DEFAULT_BASE_URL}/embeddings`);
      assert.strictEqual(options.method, "POST");

      const body = JSON.parse(options.body);
      assert.strictEqual(body.model, "text-embedding-3-large");
      assert.strictEqual(body.dimensions, 1024);
      assert.deepStrictEqual(body.input, texts);

      assert.strictEqual(result.data.length, 2);
      assert.ok(result.data[0].embedding);
      assert.ok(result.data[1].embedding);
    });

    test("createEmbeddings retries on 429 status", async () => {
      const retryResponse = {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      };
      const successResponse = {
        ok: true,
        json: mock.fn(() =>
          Promise.resolve({
            data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
          }),
        ),
      };

      // Set up mock to return retry response first, then success
      let callCount = 0;
      mockFetch.mock.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(retryResponse);
        } else {
          return Promise.resolve(successResponse);
        }
      });

      const texts = ["Hello"];
      const result = await llmApi.createEmbeddings(texts);

      // Should retry once and then succeed
      assert(mockFetch.mock.callCount() >= 2);
      assert.strictEqual(result.data.length, 1);
    });

    test("createEmbeddings throws error immediately on non-429 HTTP error", async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: mock.fn(() => Promise.resolve("Server error details")),
      };

      // Mock all attempts to fail with non-429 error (no retries)
      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(errorResponse),
      );

      const texts = ["Hello"];

      await assert.rejects(() => llmApi.createEmbeddings(texts), {
        message: /HTTP 500: Internal Server Error/,
      });

      assert.strictEqual(mockFetch.mock.callCount(), 1); // No retries for non-429
    });

    test("listModels makes correct API call", async () => {
      const mockResponse = {
        ok: true,
        json: mock.fn(() =>
          Promise.resolve({
            data: [
              { id: "gpt-4", object: "model" },
              { id: "gpt-3.5-turbo", object: "model" },
            ],
          }),
        ),
      };
      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(mockResponse),
      );

      const result = await llmApi.listModels();

      assert.strictEqual(mockFetch.mock.callCount(), 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      // listModels uses /catalog/models endpoint (not under /inference)
      assert.strictEqual(
        url,
        DEFAULT_BASE_URL.replace("/inference", "/catalog/models"),
      );
      assert.strictEqual(options.method, "GET");

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.data[0].id, "gpt-4");
      assert.strictEqual(result.data[1].id, "gpt-3.5-turbo");
    });

    test("listModels throws error on HTTP error", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: mock.fn(() => Promise.resolve("Auth error details")),
      };
      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(mockResponse),
      );

      await assert.rejects(() => llmApi.listModels(), {
        message: /HTTP 401: Unauthorized/,
      });
    });
  });

  describe("LlmApi instance methods", () => {
    let llmApi;
    let retry;

    beforeEach(() => {
      const mockFetch = mock.fn();
      retry = new Retry();
      llmApi = new LlmApi(
        "test-token",
        "gpt-4",
        DEFAULT_BASE_URL,
        retry,
        mockFetch,
      );
    });

    test("countTokens returns token count for text", () => {
      const text = "Hello, world!";
      const count = llmApi.countTokens(text);

      assert.strictEqual(typeof count, "number");
      assert(count > 0);
    });

    test("countTokens handles empty text", () => {
      const count = llmApi.countTokens("");
      assert.strictEqual(count, 0);
    });

    test("countTokens handles longer text", () => {
      const shortText = "Hello";
      const longText =
        "Hello, this is a much longer text that should have more tokens";

      const shortCount = llmApi.countTokens(shortText);
      const longCount = llmApi.countTokens(longText);

      assert(longCount > shortCount);
    });
  });

  describe("Proxy Support", () => {
    test("createLlmApi creates LlmApi instance with default fetch", async () => {
      // Import the function dynamically to test it
      const { createLlmApi, LlmApi, DEFAULT_BASE_URL } =
        await import("../index.js");

      // Create an LLM instance
      const llm = createLlmApi("test-token", "gpt-4", DEFAULT_BASE_URL);

      // Verify that the LLM was created successfully
      assert.ok(llm instanceof LlmApi);
    });

    test("createLlmApi works when HTTPS_PROXY environment variable is set", async () => {
      // Set proxy environment variable for this test
      const originalProxy = process.env.HTTPS_PROXY;
      process.env.HTTPS_PROXY = "http://proxy.example.com:3128";

      try {
        // Import the function dynamically to test it
        const { createLlmApi, LlmApi, DEFAULT_BASE_URL } =
          await import("../index.js");

        // Create an LLM instance with proxy environment
        const llm = createLlmApi("test-token", "gpt-4", DEFAULT_BASE_URL);

        // Verify that the LLM was created successfully
        assert.ok(llm instanceof LlmApi);
      } finally {
        // Restore original environment
        if (originalProxy) {
          process.env.HTTPS_PROXY = originalProxy;
        } else {
          delete process.env.HTTPS_PROXY;
        }
      }
    });
  });
});
