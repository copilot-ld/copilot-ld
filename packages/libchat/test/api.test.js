import { describe, test, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

import { ChatApi, formatMessage } from "../api.js";

describe("libchat/api", () => {
  describe("ChatApi", () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    test("constructor requires url", () => {
      assert.throws(() => new ChatApi(), { message: "url is required" });
      assert.throws(() => new ChatApi(null), { message: "url is required" });
    });

    test("constructor accepts url and optional token provider", () => {
      const api = new ChatApi("https://api.example.com");
      assert.ok(api);

      const apiWithToken = new ChatApi(
        "https://api.example.com",
        () => "token",
      );
      assert.ok(apiWithToken);
    });

    test("send makes POST request to /chat endpoint", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({ ok: true, body: { getReader: () => ({}) } }),
      );

      const api = new ChatApi("https://api.example.com");
      await api.send("Hello", "resource-123");

      assert.strictEqual(global.fetch.mock.callCount(), 1);
      const [url, options] = global.fetch.mock.calls[0].arguments;
      assert.strictEqual(url, "https://api.example.com/chat");
      assert.strictEqual(options.method, "POST");
    });

    test("send includes message and resource_id in body", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({ ok: true, body: { getReader: () => ({}) } }),
      );

      const api = new ChatApi("https://api.example.com");
      await api.send("Test message", "res-456");

      const [, options] = global.fetch.mock.calls[0].arguments;
      const body = JSON.parse(options.body);
      assert.strictEqual(body.message, "Test message");
      assert.strictEqual(body.resource_id, "res-456");
    });

    test("send includes Authorization header when token provided", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({ ok: true, body: { getReader: () => ({}) } }),
      );

      const api = new ChatApi("https://api.example.com", () => "jwt-token-abc");
      await api.send("Hello", "resource-123");

      const [, options] = global.fetch.mock.calls[0].arguments;
      assert.strictEqual(options.headers.Authorization, "Bearer jwt-token-abc");
    });

    test("send omits Authorization header when token is null", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({ ok: true, body: { getReader: () => ({}) } }),
      );

      const api = new ChatApi("https://api.example.com", () => null);
      await api.send("Hello", "resource-123");

      const [, options] = global.fetch.mock.calls[0].arguments;
      assert.strictEqual(options.headers.Authorization, undefined);
    });

    test("send throws error on HTTP error response", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        }),
      );

      const api = new ChatApi("https://api.example.com");

      await assert.rejects(() => api.send("Hello", "resource-123"), {
        message: "HTTP 500: Internal Server Error",
      });
    });
  });

  describe("ChatApi.stream", () => {
    test("yields parsed JSON objects from stream", async () => {
      const chunks = [
        '{"resource_id":"abc","messages":[]}\n',
        '{"resource_id":"abc","messages":[{"role":"assistant"}]}\n',
      ];
      let chunkIndex = 0;

      const mockReader = {
        read: mock.fn(() => {
          if (chunkIndex < chunks.length) {
            const value = new TextEncoder().encode(chunks[chunkIndex++]);
            return Promise.resolve({ done: false, value });
          }
          return Promise.resolve({ done: true });
        }),
      };

      const mockResponse = {
        body: { getReader: () => mockReader },
      };

      const api = new ChatApi("https://api.example.com");
      const results = [];
      for await (const chunk of api.stream(mockResponse)) {
        results.push(chunk);
      }

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].resource_id, "abc");
      assert.deepStrictEqual(results[0].messages, []);
    });

    test("handles partial JSON across chunks", async () => {
      const chunks = ['{"resource_id":"a', 'bc","messages":[]}\n'];
      let chunkIndex = 0;

      const mockReader = {
        read: mock.fn(() => {
          if (chunkIndex < chunks.length) {
            const value = new TextEncoder().encode(chunks[chunkIndex++]);
            return Promise.resolve({ done: false, value });
          }
          return Promise.resolve({ done: true });
        }),
      };

      const mockResponse = {
        body: { getReader: () => mockReader },
      };

      const api = new ChatApi("https://api.example.com");
      const results = [];
      for await (const chunk of api.stream(mockResponse)) {
        results.push(chunk);
      }

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].resource_id, "abc");
    });

    test("handles multiple JSON objects in single chunk", async () => {
      const chunks = ['{"id":1}\n{"id":2}\n{"id":3}\n'];
      let chunkIndex = 0;

      const mockReader = {
        read: mock.fn(() => {
          if (chunkIndex < chunks.length) {
            const value = new TextEncoder().encode(chunks[chunkIndex++]);
            return Promise.resolve({ done: false, value });
          }
          return Promise.resolve({ done: true });
        }),
      };

      const mockResponse = {
        body: { getReader: () => mockReader },
      };

      const api = new ChatApi("https://api.example.com");
      const results = [];
      for await (const chunk of api.stream(mockResponse)) {
        results.push(chunk);
      }

      assert.strictEqual(results.length, 3);
    });

    test("skips empty lines", async () => {
      const chunks = ['{"id":1}\n\n{"id":2}\n'];
      let chunkIndex = 0;

      const mockReader = {
        read: mock.fn(() => {
          if (chunkIndex < chunks.length) {
            const value = new TextEncoder().encode(chunks[chunkIndex++]);
            return Promise.resolve({ done: false, value });
          }
          return Promise.resolve({ done: true });
        }),
      };

      const mockResponse = {
        body: { getReader: () => mockReader },
      };

      const api = new ChatApi("https://api.example.com");
      const results = [];
      for await (const chunk of api.stream(mockResponse)) {
        results.push(chunk);
      }

      assert.strictEqual(results.length, 2);
    });

    test("handles final chunk without newline", async () => {
      const chunks = ['{"final":true}'];
      let chunkIndex = 0;

      const mockReader = {
        read: mock.fn(() => {
          if (chunkIndex < chunks.length) {
            const value = new TextEncoder().encode(chunks[chunkIndex++]);
            return Promise.resolve({ done: false, value });
          }
          return Promise.resolve({ done: true });
        }),
      };

      const mockResponse = {
        body: { getReader: () => mockReader },
      };

      const api = new ChatApi("https://api.example.com");
      const results = [];
      for await (const chunk of api.stream(mockResponse)) {
        results.push(chunk);
      }

      assert.strictEqual(results.length, 1);
      assert.deepStrictEqual(results[0], { final: true });
    });
  });

  describe("formatMessage", () => {
    test("returns content for normal message", () => {
      const msg = { role: "assistant", content: "Hello, world!" };
      const result = formatMessage(msg);
      assert.strictEqual(result, "Hello, world!");
    });

    test("shows tool calls when present and no content", () => {
      const msg = {
        role: "assistant",
        content: "",
        tool_calls: [
          { function: { name: "search" } },
          { function: { name: "calculate" } },
        ],
      };
      const result = formatMessage(msg);
      assert.strictEqual(result, "Calling tools: search, calculate");
    });

    test("shows content when both content and tool_calls exist", () => {
      const msg = {
        role: "assistant",
        content: "Let me search...",
        tool_calls: [{ function: { name: "search" } }],
      };
      const result = formatMessage(msg);
      assert.strictEqual(result, "Let me search...");
    });

    test("formats tool role messages", () => {
      const msg = { role: "tool", content: '{"result": "success"}' };
      const result = formatMessage(msg);
      assert.strictEqual(result, 'Tool Result: {"result": "success"}');
    });

    test("returns empty string for empty content", () => {
      const msg = { role: "assistant", content: "" };
      const result = formatMessage(msg);
      assert.strictEqual(result, "");
    });

    test("returns empty string for undefined content", () => {
      const msg = { role: "assistant" };
      const result = formatMessage(msg);
      assert.strictEqual(result, "");
    });
  });
});
