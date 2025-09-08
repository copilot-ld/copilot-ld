/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { Copilot, LlmInterface } from "../index.js";

describe("libcopilot", () => {
  describe("Copilot", () => {
    let mockFetch;
    let copilot;

    beforeEach(() => {
      mockFetch = mock.fn();
      copilot = new Copilot("test-token", "gpt-4", mockFetch);
    });

    test("creates copilot with token and model", () => {
      assert.ok(copilot instanceof Copilot);
      assert.ok(copilot instanceof LlmInterface);
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

      const params = {
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 100,
        temperature: 0.5,
      };

      const result = await copilot.createCompletions(params);

      assert.strictEqual(mockFetch.mock.callCount(), 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.strictEqual(url, "https://api.githubcopilot.com/chat/completions");
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

      const params = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await copilot.createCompletions(params);

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

      const params = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await assert.rejects(() => copilot.createCompletions(params), {
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

      const params = {
        messages: [{ role: "user", content: "Hello" }],
      };

      await assert.rejects(() => copilot.createCompletions(params), {
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
      const result = await copilot.createEmbeddings(texts);

      assert.strictEqual(mockFetch.mock.callCount(), 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.strictEqual(url, "https://api.githubcopilot.com/embeddings");
      assert.strictEqual(options.method, "POST");

      const body = JSON.parse(options.body);
      assert.strictEqual(body.model, "text-embedding-3-small");
      assert.strictEqual(body.dimensions, 256);
      assert.deepStrictEqual(body.input, texts);

      assert.strictEqual(result.length, 2);
      assert.ok(result[0].embedding);
      assert.ok(result[1].embedding);
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
      const result = await copilot.createEmbeddings(texts);

      // Should retry once and then succeed
      assert(mockFetch.mock.callCount() >= 2);
      assert.strictEqual(result.length, 1);
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

      await assert.rejects(() => copilot.createEmbeddings(texts), {
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

      const result = await copilot.listModels();

      assert.strictEqual(mockFetch.mock.callCount(), 1);
      const [url, options] = mockFetch.mock.calls[0].arguments;
      assert.strictEqual(url, "https://api.githubcopilot.com/models");
      assert.strictEqual(options.method, "GET");

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, "gpt-4");
      assert.strictEqual(result[1].id, "gpt-3.5-turbo");
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

      await assert.rejects(() => copilot.listModels(), {
        message: /HTTP 401: Unauthorized/,
      });
    });
  });

  describe("Retry behavior", () => {
    let mockFetch;
    let copilot;

    beforeEach(() => {
      mockFetch = mock.fn();
      copilot = new Copilot("test-token", "gpt-4", mockFetch);
      // Use very short delays for testing to speed up retry tests
      copilot._setTestDelay(1);
    });

    test("retry mechanism works for both createCompletions and createEmbeddings", async () => {
      const retryResponse = {
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: mock.fn(() => Promise.resolve("Rate limit exceeded")),
      };

      // Test both methods fail with max retries
      mockFetch.mock.mockImplementation(() => Promise.resolve(retryResponse));

      // Test createCompletions
      await assert.rejects(() =>
        copilot.createCompletions({
          messages: [{ role: "user", content: "Hello" }],
        }),
      );
      assert.strictEqual(mockFetch.mock.callCount(), 4); // Initial + 3 retries

      // Reset mock for second test
      mockFetch.mock.resetCalls();

      // Test createEmbeddings
      await assert.rejects(() => copilot.createEmbeddings(["test text"]));
      assert.strictEqual(mockFetch.mock.callCount(), 4); // Initial + 3 retries
    });

    test("non-429 errors do not trigger retries", async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: mock.fn(() => Promise.resolve("Server error")),
      };

      mockFetch.mock.mockImplementationOnce(() =>
        Promise.resolve(errorResponse),
      );

      await assert.rejects(() =>
        copilot.createCompletions({
          messages: [{ role: "user", content: "Hello" }],
        }),
      );

      // Should only make one call for non-429 errors
      assert.strictEqual(mockFetch.mock.callCount(), 1);
    });
  });

  describe("Copilot instance methods", () => {
    let copilot;

    beforeEach(() => {
      const mockFetch = mock.fn();
      copilot = new Copilot("test-token", "gpt-4", mockFetch);
    });

    test("countTokens returns token count for text", () => {
      const text = "Hello, world!";
      const count = copilot.countTokens(text);

      assert.strictEqual(typeof count, "number");
      assert(count > 0);
    });

    test("countTokens handles empty text", () => {
      const count = copilot.countTokens("");
      assert.strictEqual(count, 0);
    });

    test("countTokens handles longer text", () => {
      const shortText = "Hello";
      const longText =
        "Hello, this is a much longer text that should have more tokens";

      const shortCount = copilot.countTokens(shortText);
      const longCount = copilot.countTokens(longText);

      assert(longCount > shortCount);
    });
  });
});
