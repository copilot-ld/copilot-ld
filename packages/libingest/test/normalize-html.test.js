// Standard imports - always first
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";

// Module under test - second section
import { NormalizeHtml, STEP_NAME } from "../steps/normalize-html.js";
import { STEP_NAME as ANNOTATE_HTML_STEP } from "../steps/annotate-html.js";
import { PromptLoader } from "@copilot-ld/libprompt";

// Mock storage for testing
/**
 * Creates a mock storage instance for testing.
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock storage with get, put, exists, delete methods
 */
function createMockStorage(overrides = {}) {
  const storage = {
    data: new Map(),
    get: async (key) => storage.data.get(key) || null,
    put: async (key, value) => {
      storage.data.set(key, value);
    },
    exists: async (key) => storage.data.has(key),
    delete: async (key) => storage.data.delete(key),
    ...overrides,
  };
  return storage;
}

// Mock logger for testing
/**
 * Creates a mock logger instance for testing.
 * @returns {object} Mock logger with debug, info, error methods and logs array
 */
function createMockLogger() {
  const logs = [];
  return {
    debug: (msg) => logs.push({ level: "debug", msg }),
    info: (msg) => logs.push({ level: "info", msg }),
    error: (msg) => logs.push({ level: "error", msg }),
    logs,
  };
}

// Mock config for testing
/**
 * Creates a mock config instance for testing.
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock config with llmToken, llmBaseUrl, embeddingBaseUrl methods
 */
function createMockConfig(overrides = {}) {
  return {
    llmToken: async () => "test-token",
    llmBaseUrl: () => "http://localhost:8080",
    embeddingBaseUrl: () => null,
    ...overrides,
  };
}

describe("NormalizeHtml", () => {
  let mockStorage;
  let mockLogger;
  let mockConfig;
  let promptLoader;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    promptLoader = new PromptLoader(join(import.meta.dirname, "../prompts"));
  });

  describe("constructor", () => {
    test("creates instance with required parameters", () => {
      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      assert.ok(step);
    });

    test("accepts modelConfig parameter", () => {
      const modelConfig = { model: "gpt-4", maxTokens: 1000 };
      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        modelConfig,
        mockConfig,
        promptLoader,
      );
      assert.ok(step);
    });
  });

  describe("process", () => {
    test("normalizes HTML and saves to storage", async () => {
      const annotatedHtml = `<html>
  <body>
    <div class="test" id="main">Content</div>
  </body>
</html>`;

      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
            annotatedHtmlKey: "pipeline/abc123/annotated.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/annotated.html", annotatedHtml);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      await step.process("pipeline/abc123/context.json");

      const outputHtml = await mockStorage.get("pipeline/abc123/output.html");
      assert.ok(outputHtml);
      assert.strictEqual(typeof outputHtml, "string");
    });

    test("removes markdown code block wrappers", async () => {
      const annotatedHtml = "```html\n<html><body>Test</body></html>\n```";

      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
            annotatedHtmlKey: "pipeline/abc123/annotated.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/annotated.html", annotatedHtml);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      await step.process("pipeline/abc123/context.json");

      const outputHtml = await mockStorage.get("pipeline/abc123/output.html");
      assert.ok(!outputHtml.includes("```html"));
      assert.ok(!outputHtml.includes("```"));
    });

    test("marks step as completed with pipeline metadata", async () => {
      const annotatedHtml = "<html><body>Test</body></html>";

      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
            annotatedHtmlKey: "pipeline/abc123/annotated.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/annotated.html", annotatedHtml);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      await step.process("pipeline/abc123/context.json");

      const updatedContextRaw = await mockStorage.get(
        "pipeline/abc123/context.json",
      );
      const updatedContext =
        typeof updatedContextRaw === "string"
          ? JSON.parse(updatedContextRaw)
          : updatedContextRaw;
      assert.strictEqual(updatedContext.steps[STEP_NAME].status, "COMPLETED");
      assert.ok(updatedContext.steps[STEP_NAME].outputKey);
      assert.strictEqual(updatedContext.pipeline.output, "output.html");
      assert.strictEqual(updatedContext.pipeline.outputMimeType, "text/html");
    });

    test("throws error when annotated HTML key is missing", async () => {
      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /No annotatedHtmlKey found/,
      });
    });

    test("logs debug messages during processing", async () => {
      const annotatedHtml = "<html><body>Test</body></html>";

      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
            annotatedHtmlKey: "pipeline/abc123/annotated.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/annotated.html", annotatedHtml);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      await step.process("pipeline/abc123/context.json");

      assert.ok(mockLogger.logs.length > 0);
      assert.ok(
        mockLogger.logs.some((log) => log.msg.includes("Normalizing HTML")),
      );
      assert.ok(
        mockLogger.logs.some((log) => log.msg.includes("Saved final output")),
      );
    });
  });

  describe("HTML normalization", () => {
    test("normalizes line endings", async () => {
      const annotatedHtml = "<html>\r\n<body>Test</body>\r\n</html>";

      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
            annotatedHtmlKey: "pipeline/abc123/annotated.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/annotated.html", annotatedHtml);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      await step.process("pipeline/abc123/context.json");

      const outputHtml = await mockStorage.get("pipeline/abc123/output.html");
      assert.ok(!outputHtml.includes("\r\n"));
    });

    test("sorts attributes alphabetically", async () => {
      const annotatedHtml =
        '<div id="test" class="main" data-value="123">Content</div>';

      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
            annotatedHtmlKey: "pipeline/abc123/annotated.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/annotated.html", annotatedHtml);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      await step.process("pipeline/abc123/context.json");

      const outputHtml = await mockStorage.get("pipeline/abc123/output.html");
      // Attributes should be sorted: class, data-value, id
      assert.ok(outputHtml.includes('class="main"'));
      assert.ok(outputHtml.includes('data-value="123"'));
      assert.ok(outputHtml.includes('id="test"'));
    });

    test("removes excessive blank lines", async () => {
      const annotatedHtml = "<html>\n\n\n\n<body>Test</body>\n\n\n</html>";

      const ingestContext = {
        steps: {
          [ANNOTATE_HTML_STEP]: {
            status: "COMPLETED",
            annotatedHtmlKey: "pipeline/abc123/annotated.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/annotated.html", annotatedHtml);

      const step = new NormalizeHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      await step.process("pipeline/abc123/context.json");

      const outputHtml = await mockStorage.get("pipeline/abc123/output.html");
      assert.ok(!outputHtml.includes("\n\n\n"));
    });
  });

  describe("STEP_NAME constant", () => {
    test("exports correct step name", () => {
      assert.strictEqual(STEP_NAME, "normalize-html");
    });
  });
});
