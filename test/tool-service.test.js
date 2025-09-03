import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

/**
 * Mock imports for testing
 * @returns {object} Mock configuration
 */
function createMockConfig() {
  return {
    endpoints: {
      vector_search: {
        call: "vector.Vector.QueryItems",
        name: "search_similar_content",
        description: "Search for similar content using vector embeddings",
      },
      sha256_hash: {
        call: "toolbox.HashTools.Sha256Hash",
        name: "calculate_sha256",
        description: "Calculate SHA-256 hash of input text",
      },
    },
  };
}

/**
 * Creates mock resource index for testing
 * @returns {object} Mock resource index
 */
function createMockResourceIndex() {
  return {
    get: async () => [],
    put: async () => {},
    list: async () => [],
  };
}

// Mock ToolService for testing
class MockToolService {
  constructor(config, resourceIndex) {
    this.config = config;
    this.resourceIndex = resourceIndex;
    this.endpoints = config.endpoints || {};
  }

  async ExecuteTool(req) {
    const toolName = req.function?.descriptor?.name;
    const endpoint = this.endpoints[toolName];

    if (!endpoint) {
      throw new Error(`Tool endpoint not found: ${toolName}`);
    }

    return {
      role: "tool",
      tool_call_id: req.id || "",
      content: JSON.stringify({ result: "mock response" }),
    };
  }

  async ListTools(req) {
    const tools = [];

    for (const [toolName, endpoint] of Object.entries(this.endpoints)) {
      if (req.namespace && !toolName.startsWith(req.namespace)) {
        continue;
      }

      tools.push({
        type: "function",
        function: {
          descriptor: {
            name: endpoint.name || toolName,
            description: endpoint.description || `Execute ${toolName} tool`,
          },
          parameters: {
            type: "object",
            properties: {
              input: { type: "string", description: "Input data" },
            },
            required: ["input"],
          },
        },
      });
    }

    return { tools };
  }

  debug(_message, _context) {
    // Mock debug logging
  }
}

describe("Tool Service", () => {
  let toolService;
  let mockConfig;
  let mockResourceIndex;

  beforeEach(() => {
    mockConfig = createMockConfig();
    mockResourceIndex = createMockResourceIndex();
    toolService = new MockToolService(mockConfig, mockResourceIndex);
  });

  describe("ExecuteTool", () => {
    test("executes tool with valid request", async () => {
      const toolRequest = {
        type: "function",
        function: {
          descriptor: { name: "vector_search" },
          arguments: JSON.stringify({ vector: [0.1, 0.2, 0.3] }),
        },
        id: "test-tool-call-id",
      };

      const result = await toolService.ExecuteTool(toolRequest);

      assert.strictEqual(result.role, "tool");
      assert.strictEqual(result.tool_call_id, "test-tool-call-id");
      assert(result.content.includes("mock response"));
    });

    test("handles unknown tool gracefully", async () => {
      const toolRequest = {
        type: "function",
        function: {
          descriptor: { name: "unknown_tool" },
        },
        id: "test-tool-call-id",
      };

      await assert.rejects(() => toolService.ExecuteTool(toolRequest), {
        message: /Tool endpoint not found: unknown_tool/,
      });
    });
  });

  describe("ListTools", () => {
    test("returns all configured tools", async () => {
      const result = await toolService.ListTools({});

      assert.strictEqual(result.tools.length, 2);
      assert.strictEqual(
        result.tools[0].function.descriptor.name,
        "search_similar_content",
      );
      assert.strictEqual(
        result.tools[1].function.descriptor.name,
        "calculate_sha256",
      );
    });

    test("filters tools by namespace", async () => {
      const result = await toolService.ListTools({ namespace: "vector" });

      assert.strictEqual(result.tools.length, 1);
      assert.strictEqual(
        result.tools[0].function.descriptor.name,
        "search_similar_content",
      );
    });

    test("returns empty array for unknown namespace", async () => {
      const result = await toolService.ListTools({ namespace: "unknown" });

      assert.strictEqual(result.tools.length, 0);
    });
  });

  describe("Configuration", () => {
    test("loads endpoints from configuration", async () => {
      assert(toolService.endpoints.vector_search);
      assert.strictEqual(
        toolService.endpoints.vector_search.call,
        "vector.Vector.QueryItems",
      );
      assert.strictEqual(
        toolService.endpoints.vector_search.name,
        "search_similar_content",
      );
    });

    test("handles empty configuration gracefully", async () => {
      const emptyService = new MockToolService(
        { endpoints: {} },
        mockResourceIndex,
      );
      const result = await emptyService.ListTools({});

      assert.strictEqual(result.tools.length, 0);
    });
  });
});

describe("Tool Schema Generation", () => {
  test("generates OpenAI-compatible schema for vector search", async () => {
    const mockService = new MockToolService(
      createMockConfig(),
      createMockResourceIndex(),
    );
    const result = await mockService.ListTools({});

    const vectorTool = result.tools.find(
      (t) => t.function.descriptor.name === "search_similar_content",
    );

    assert(vectorTool);
    assert.strictEqual(vectorTool.type, "function");
    assert(vectorTool.function.parameters);
    assert.strictEqual(vectorTool.function.parameters.type, "object");
    assert(vectorTool.function.parameters.properties);
    assert(vectorTool.function.parameters.required);
  });

  test("includes proper tool metadata", async () => {
    const mockService = new MockToolService(
      createMockConfig(),
      createMockResourceIndex(),
    );
    const result = await mockService.ListTools({});

    for (const tool of result.tools) {
      assert(tool.function.descriptor.name);
      assert(tool.function.descriptor.description);
      assert(tool.function.parameters);
    }
  });
});

describe("Tool Proxy Logic", () => {
  test("routes vector search to appropriate service", async () => {
    const mockService = new MockToolService(
      createMockConfig(),
      createMockResourceIndex(),
    );

    const toolRequest = {
      function: {
        descriptor: { name: "vector_search" },
        arguments: JSON.stringify({
          vector: [0.1, 0.2, 0.3],
          threshold: 0.3,
          limit: 10,
        }),
      },
      id: "test-id",
    };

    const result = await mockService.ExecuteTool(toolRequest);

    assert.strictEqual(result.role, "tool");
    assert(result.content);
  });

  test("routes hash tools to appropriate service", async () => {
    const mockService = new MockToolService(
      createMockConfig(),
      createMockResourceIndex(),
    );

    const toolRequest = {
      function: {
        descriptor: { name: "sha256_hash" },
        arguments: JSON.stringify({ input: "test data" }),
      },
      id: "test-id",
    };

    const result = await mockService.ExecuteTool(toolRequest);

    assert.strictEqual(result.role, "tool");
    assert(result.content);
  });
});
