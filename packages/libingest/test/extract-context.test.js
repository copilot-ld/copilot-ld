/* eslint-env node */
// Standard imports - always first
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Module under test - second section
import { ExtractContext, STEP_NAME } from "../steps/extract-context.js";
import { STEP_NAME as IMAGES_TO_HTML_STEP } from "../steps/images-to-html.js";

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

describe("ExtractContext", () => {
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
    if (originalEnv !== undefined) {
      globalThis.process.env.GITHUB_TOKEN = originalEnv;
    } else {
      delete globalThis.process.env.GITHUB_TOKEN;
    }
  });

  describe("constructor", () => {
    test("creates instance with required parameters", () => {
      const step = new ExtractContext(mockStorage, mockLogger);
      assert.ok(step);
    });

    test("accepts optional modelConfig", () => {
      const modelConfig = { model: "gpt-4", maxTokens: 1000 };
      const step = new ExtractContext(mockStorage, mockLogger, modelConfig);
      assert.ok(step);
    });

    test("loads context extractor prompt", () => {
      const step = new ExtractContext(mockStorage, mockLogger);
      assert.ok(step);
      // The prompt should be loaded in constructor
      // We can't directly test the private field, but constructor should not throw
    });
  });

  describe("process", () => {
    test("throws error when HTML key is missing from previous step", async () => {
      const ingestContext = {
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            // Missing htmlKey
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new ExtractContext(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /No htmlKey found/,
      });
    });

    test("throws error when HTML content is invalid", async () => {
      const ingestContext = {
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            htmlKey: "pipeline/abc123/output.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      // Don't put anything for output.html - storage.get will return null

      const step = new ExtractContext(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /Invalid HTML content/,
      });
    });

    test("throws error when GITHUB_TOKEN is not set", async () => {
      delete globalThis.process.env.GITHUB_TOKEN;

      const ingestContext = {
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            htmlKey: "pipeline/abc123/output.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put(
        "pipeline/abc123/output.html",
        "<html><body>Test</body></html>",
      );

      const step = new ExtractContext(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /GitHub token not found/,
      });

      // Restore token
      globalThis.process.env.GITHUB_TOKEN = originalEnv;
    });

    test("logs debug messages during processing", async () => {
      const ingestContext = {
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            htmlKey: "pipeline/abc123/output.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put(
        "pipeline/abc123/output.html",
        "<html><body>Test</body></html>",
      );

      const step = new ExtractContext(mockStorage, mockLogger);

      try {
        await step.process("pipeline/abc123/context.json");
      } catch {
        // LLM call will fail in test environment, but we can check logs
        assert.ok(mockLogger.logs.length > 0);
        assert.ok(
          mockLogger.logs.some((log) => log.msg.includes("Extracting context")),
        );
      }
    });
  });

  describe("STEP_NAME constant", () => {
    test("exports correct step name", () => {
      assert.strictEqual(STEP_NAME, "extract-context");
    });
  });

  describe("integration behavior", () => {
    test("validates required context properties", async () => {
      const ingestContext = {
        steps: {
          [IMAGES_TO_HTML_STEP]: {
            status: "COMPLETED",
            htmlKey: "pipeline/abc123/output.html",
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new ExtractContext(mockStorage, mockLogger);

      // Verify the step can access context properties
      const context = await step.loadIngestContext(
        "pipeline/abc123/context.json",
      );
      assert.ok(context.steps[IMAGES_TO_HTML_STEP]);
      assert.strictEqual(
        context.steps[IMAGES_TO_HTML_STEP].htmlKey,
        "pipeline/abc123/output.html",
      );
    });

    test("extracts target directory correctly", () => {
      const step = new ExtractContext(mockStorage, mockLogger);
      const targetDir = step.getTargetDir("pipeline/abc123/context.json");
      assert.strictEqual(targetDir, "pipeline/abc123");
    });

    test("uses configured model settings", () => {
      const modelConfig = { model: "gpt-4-turbo", maxTokens: 8000 };
      const step = new ExtractContext(mockStorage, mockLogger, modelConfig);

      assert.strictEqual(step.getModel(), "gpt-4-turbo");
      assert.strictEqual(step.getMaxTokens(), 8000);
    });
  });
});
