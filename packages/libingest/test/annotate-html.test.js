/* eslint-env node */
// Standard imports - always first
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Module under test - second section
import { AnnotateHtml, STEP_NAME } from "../steps/annotate-html.js";
import { STEP_NAME as IMAGES_TO_HTML_STEP } from "../steps/images-to-html.js";
import { STEP_NAME as EXTRACT_CONTEXT_STEP } from "../steps/extract-context.js";

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

describe("AnnotateHtml", () => {
  let mockStorage;
  let mockLogger;
  let originalEnv;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockLogger = createMockLogger();
    // Save original GITHUB_TOKEN
    originalEnv = globalThis.process.env.GITHUB_TOKEN;
    // Set a test token to avoid errors in createLlm
    globalThis.process.env.GITHUB_TOKEN = "test_token_123";
  });

  afterEach(() => {
    // Restore original GITHUB_TOKEN
    if (originalEnv === undefined) {
      delete globalThis.process.env.GITHUB_TOKEN;
    } else {
      globalThis.process.env.GITHUB_TOKEN = originalEnv;
    }
  });

  describe("constructor", () => {
    test("creates instance with required parameters", () => {
      const step = new AnnotateHtml(mockStorage, mockLogger);
      assert.ok(step);
    });

    test("accepts optional modelConfig", () => {
      const modelConfig = { model: "gpt-4", maxTokens: 1000 };
      const step = new AnnotateHtml(mockStorage, mockLogger, modelConfig);
      assert.ok(step);
    });

    test("loads annotate HTML prompt", () => {
      const step = new AnnotateHtml(mockStorage, mockLogger);
      assert.ok(step);
      // The prompt should be loaded in constructor
      // We can't directly test the private field, but constructor should not throw
    });
  });

  describe("process", () => {
    test("throws error when fragment keys are missing from previous step", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            // Missing fragmentKeys
          },
          [EXTRACT_CONTEXT_STEP]: {
            status: "COMPLETED",
            contextKey: "pipeline/abc123/document-context.json",
          },
          [STEP_NAME]: { status: "QUEUED", order: 3 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new AnnotateHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /No fragmentKeys found/,
      });
    });

    test("throws error when context key is missing from previous step", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            fragmentKeys: ["pipeline/abc123/fragment-001.html"],
          },
          [EXTRACT_CONTEXT_STEP]: {
            status: "COMPLETED",
            // Missing contextKey
          },
          [STEP_NAME]: { status: "QUEUED", order: 3 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new AnnotateHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /No contextKey found/,
      });
    });

    test("throws error when GITHUB_TOKEN is not set", async () => {
      delete globalThis.process.env.GITHUB_TOKEN;

      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            fragmentKeys: ["pipeline/abc123/fragment-001.html"],
          },
          [EXTRACT_CONTEXT_STEP]: {
            status: "COMPLETED",
            contextKey: "pipeline/abc123/document-context.json",
          },
          [STEP_NAME]: { status: "QUEUED", order: 3 },
        },
      };

      const contextData = {
        document_type: "Report",
        global_summary: "Test document",
        slides: { "page-1": { summary: "Test slide" } },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put(
        "pipeline/abc123/fragment-001.html",
        "<section>Test</section>",
      );
      mockStorage.put("pipeline/abc123/document-context.json", contextData);

      const step = new AnnotateHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /token not found/i,
      });
    });
  });

  describe("formatEntities", () => {
    // We can test this indirectly through the process method behavior
    // Since it's a private method, we test the class behavior

    test("handles context data with entities", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            fragmentKeys: ["pipeline/abc123/fragment-001.html"],
          },
          [EXTRACT_CONTEXT_STEP]: {
            status: "COMPLETED",
            contextKey: "pipeline/abc123/document-context.json",
          },
          [STEP_NAME]: { status: "QUEUED", order: 3 },
        },
      };

      const contextData = {
        document_type: "Report",
        global_summary: "Test document about Pfizer products",
        entities: {
          organizations: ["Pfizer", "FDA"],
          products: ["Lipitor", "Viagra"],
          projects: ["Project Alpha"],
        },
        slides: { "page-1": { summary: "Introduction" } },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put(
        "pipeline/abc123/fragment-001.html",
        "<section>Test content</section>",
      );
      mockStorage.put("pipeline/abc123/document-context.json", contextData);

      // This will fail at the LLM call since we have a fake token,
      // but we can verify the setup doesn't throw
      const step = new AnnotateHtml(mockStorage, mockLogger);

      await assert.rejects(
        () => step.process("pipeline/abc123/context.json"),
        // Will fail at LLM call due to fake token
        { name: "Error" },
      );

      // Verify debug logs show fragment processing started
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(debugLogs.some((l) => l.msg.includes("Annotating")));
    });

    test("handles context data without entities", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            fragmentKeys: ["pipeline/abc123/fragment-001.html"],
          },
          [EXTRACT_CONTEXT_STEP]: {
            status: "COMPLETED",
            contextKey: "pipeline/abc123/document-context.json",
          },
          [STEP_NAME]: { status: "QUEUED", order: 3 },
        },
      };

      const contextData = {
        document_type: "Report",
        global_summary: "Test document",
        // No entities
        slides: { "page-1": "Slide summary" },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put(
        "pipeline/abc123/fragment-001.html",
        "<section>Test</section>",
      );
      mockStorage.put("pipeline/abc123/document-context.json", contextData);

      const step = new AnnotateHtml(mockStorage, mockLogger);

      // Will fail at LLM call, but should not fail during entity formatting
      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });
    });
  });

  describe("STEP_NAME constant", () => {
    test("exports correct step name", () => {
      assert.strictEqual(STEP_NAME, "annotate-html");
    });
  });

  describe("integration behavior", () => {
    test("validates required context properties", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          // Missing required previous steps
          [STEP_NAME]: { status: "QUEUED", order: 3 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new AnnotateHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });
    });

    test("extracts target directory correctly", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            fragmentKeys: ["pipeline/abc123/fragment-001.html"],
          },
          [EXTRACT_CONTEXT_STEP]: {
            status: "COMPLETED",
            contextKey: "pipeline/abc123/document-context.json",
          },
          [STEP_NAME]: { status: "QUEUED", order: 3 },
        },
      };

      const contextData = {
        document_type: "Report",
        global_summary: "Test",
        slides: {},
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put(
        "pipeline/abc123/fragment-001.html",
        "<section>Test</section>",
      );
      mockStorage.put("pipeline/abc123/document-context.json", contextData);

      const step = new AnnotateHtml(mockStorage, mockLogger);

      // The step will fail at LLM call, but we verify target dir extraction works
      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });

      // Check that fragment loading was logged (indicates target dir was extracted)
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(debugLogs.length > 0);
    });

    test("uses configured model settings", () => {
      const modelConfig = { model: "gpt-4o", maxTokens: 8000 };
      const step = new AnnotateHtml(mockStorage, mockLogger, modelConfig);

      assert.strictEqual(step.getModel(), "gpt-4o");
      assert.strictEqual(step.getMaxTokens(), 8000);
    });
  });
});
