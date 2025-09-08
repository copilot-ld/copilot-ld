/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

import { ToolService } from "../index.js";

describe("ToolService", () => {
  let mockConfig;
  let mockResourceIndex;
  let mockLogFn;

  beforeEach(() => {
    mockConfig = {
      name: "tool",
      endpoints: {
        vector_search: {
          method: "vector.Vector.QueryItems",
          name: "search_similar_content",
          description: "Search for similar content using vector embeddings",
        },
        sha256_hash: {
          method: "hash.Hash.Sha256",
          name: "calculate_sha256",
          description: "Calculate SHA-256 hash of input text",
        },
      },
    };

    mockResourceIndex = {
      get: mock.fn(),
      put: mock.fn(),
      list: mock.fn(),
      delete: mock.fn(),
    };

    mockLogFn = mock.fn(() => ({
      debug: mock.fn(),
    }));
  });

  test("should require config parameter", () => {
    assert.throws(
      () => new ToolService(null, mockResourceIndex),
      /config is required/,
    );
  });

  test("should create instance with valid parameters", () => {
    const service = new ToolService(mockConfig, mockResourceIndex, mockLogFn);

    assert.ok(service);
    assert.strictEqual(service.config, mockConfig);
  });

  test("should use default log factory when not provided", () => {
    const service = new ToolService(mockConfig, mockResourceIndex);

    assert.ok(service);
    assert.ok(typeof service.debug === "function");
  });

  test("should handle config without endpoints", () => {
    const configWithoutEndpoints = { name: "tool" };
    const service = new ToolService(configWithoutEndpoints, mockResourceIndex);

    assert.ok(service);
    assert.deepStrictEqual(service.endpoints, {});
  });

  describe("ExecuteTool", () => {
    test("should handle tool request without id", async () => {
      const service = new ToolService(mockConfig, mockResourceIndex);

      const toolRequest = {
        type: "function",
        function: {
          id: { name: "sha256_hash" },
          arguments: JSON.stringify({ input: "test data" }),
        },
      };

      const response = await service.ExecuteTool(toolRequest);

      assert.strictEqual(response.role, "tool");
      assert.strictEqual(response.tool_call_id, "");
      assert.ok(response.content);
    });

    test("should handle invalid JSON arguments", async () => {
      const service = new ToolService(mockConfig, mockResourceIndex);

      const toolRequest = {
        type: "function",
        function: {
          id: { name: "vector_search" },
          arguments: "invalid json",
        },
        id: "test-id",
      };

      // Should not throw, but may return error in response
      const response = await service.ExecuteTool(toolRequest);
      assert.strictEqual(response.role, "tool");
      assert.ok(response.content);
    });
  });

  describe("ListTools", () => {
    test("should return all configured tools", async () => {
      // Mock the ResourceIndex to return tool schemas
      mockResourceIndex.get = mock.fn(async (actor, resourceId) => {
        if (resourceId.includes("vector_search")) {
          return {
            toolSchema: {
              type: "function",
              function: {
                descriptor: { name: "search_similar_content" },
              },
            },
          };
        }
        if (resourceId.includes("sha256_hash")) {
          return {
            toolSchema: {
              type: "function",
              function: {
                descriptor: { name: "calculate_sha256" },
              },
            },
          };
        }
        return null;
      });

      const service = new ToolService(mockConfig, mockResourceIndex, mockLogFn);

      const response = await service.ListTools({});

      assert.strictEqual(response.tools.length, 2);

      const searchTool = response.tools.find(
        (t) => t.function.descriptor.name === "search_similar_content",
      );
      const hashTool = response.tools.find(
        (t) => t.function.descriptor.name === "calculate_sha256",
      );

      assert.ok(searchTool);
      assert.ok(hashTool);
      assert.strictEqual(searchTool.type, "function");
      assert.strictEqual(hashTool.type, "function");
    });

    test("should filter tools by namespace", async () => {
      // Mock the ResourceIndex to return tool schemas
      mockResourceIndex.get = mock.fn(async (actor, resourceId) => {
        if (resourceId.includes("vector_search")) {
          return {
            toolSchema: {
              type: "function",
              function: {
                descriptor: { name: "search_similar_content" },
              },
            },
          };
        }
        return null;
      });

      const service = new ToolService(mockConfig, mockResourceIndex);

      const response = await service.ListTools({ namespace: "vector" });

      assert.strictEqual(response.tools.length, 1);
      assert.strictEqual(
        response.tools[0].function.descriptor.name,
        "search_similar_content",
      );
    });

    test("should return empty array for unknown namespace", async () => {
      const service = new ToolService(mockConfig, mockResourceIndex);

      const response = await service.ListTools({ namespace: "unknown" });

      assert.strictEqual(response.tools.length, 0);
    });

    test("should handle empty configuration gracefully", async () => {
      const emptyConfig = { name: "tool", endpoints: {} };
      const service = new ToolService(emptyConfig, mockResourceIndex);

      const response = await service.ListTools({});

      assert.strictEqual(response.tools.length, 0);
    });

    test("should generate proper OpenAI-compatible schema", async () => {
      // Mock the ResourceIndex to return proper tool schemas
      mockResourceIndex.get = mock.fn(async (_actor, _resourceId) => {
        return {
          toolSchema: {
            type: "function",
            function: {
              descriptor: {
                name: "test_tool",
                description: "Test tool description",
              },
              parameters: {
                type: "object",
                properties: {
                  input: { type: "string" },
                },
                required: ["input"],
              },
            },
          },
        };
      });

      const service = new ToolService(mockConfig, mockResourceIndex);

      const response = await service.ListTools({});

      for (const tool of response.tools) {
        assert.strictEqual(tool.type, "function");
        assert.ok(tool.function.descriptor.name);
        assert.ok(tool.function.descriptor.description);
        assert.ok(tool.function.parameters);
        assert.strictEqual(tool.function.parameters.type, "object");
        assert.ok(tool.function.parameters.properties);
        assert.ok(Array.isArray(tool.function.parameters.required));
      }
    });
  });

  describe("Service Interface", () => {
    test("should return correct proto name", () => {
      const service = new ToolService(mockConfig, mockResourceIndex);

      assert.strictEqual(service.getProtoName(), "tool.proto");
    });

    test("should return handlers map", () => {
      const service = new ToolService(mockConfig, mockResourceIndex);

      const handlers = service.getHandlers();

      assert.ok(handlers);
      assert.ok(typeof handlers.ExecuteTool === "function");
      assert.ok(typeof handlers.ListTools === "function");
    });

    test("handlers should call service methods", async () => {
      const service = new ToolService(mockConfig, mockResourceIndex);
      const handlers = service.getHandlers();

      const mockCall = {
        request: {
          type: "function",
          function: {
            descriptor: { name: "vector_search" },
            arguments: JSON.stringify({ test: "data" }),
          },
          id: "test",
        },
      };

      const response = await handlers.ExecuteTool(mockCall);

      assert.strictEqual(response.role, "tool");
      assert.strictEqual(response.tool_call_id, "test");
    });
  });

  describe("Tool Configuration", () => {
    test("should load endpoints from configuration", () => {
      const service = new ToolService(mockConfig, mockResourceIndex);

      assert.ok(service.endpoints.vector_search);
      assert.strictEqual(
        service.endpoints.vector_search.method,
        "vector.Vector.QueryItems",
      );
      assert.strictEqual(
        service.endpoints.vector_search.name,
        "search_similar_content",
      );
    });

    test("should handle missing endpoint configuration", () => {
      const configWithoutEndpoints = { name: "tool" };
      const service = new ToolService(
        configWithoutEndpoints,
        mockResourceIndex,
      );

      assert.deepStrictEqual(service.endpoints, {});
    });
  });

  describe("Tool Proxy Logic", () => {
    test("should route hash tools to appropriate service", async () => {
      const service = new ToolService(mockConfig, mockResourceIndex);

      const toolRequest = {
        function: {
          id: { name: "sha256_hash" },
          arguments: JSON.stringify({ input: "test data" }),
        },
        id: "test-id",
      };

      const response = await service.ExecuteTool(toolRequest);

      assert.strictEqual(response.role, "tool");
      assert.ok(response.content);
    });
  });

  describe("Debug Logging", () => {
    test("should log debug messages when logger provided", () => {
      const mockLogger = { debug: mock.fn() };
      const logFn = mock.fn(() => mockLogger);

      const service = new ToolService(mockConfig, mockResourceIndex, logFn);

      service.debug("test message", { context: "test" });

      assert.strictEqual(logFn.mock.callCount(), 1);
      assert.strictEqual(logFn.mock.calls[0].arguments[0], "tool");
      assert.strictEqual(mockLogger.debug.mock.callCount(), 1);
      assert.strictEqual(
        mockLogger.debug.mock.calls[0].arguments[0],
        "test message",
      );
    });
  });
});
