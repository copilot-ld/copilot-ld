/* eslint-env node */
// Standard imports - always first
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Module under test - second section
import { ImagesToHtml, STEP_NAME } from "./images-to-html.js";
import { STEP_NAME as PDF_TO_IMAGES_STEP } from "./pdf-to-images.js";

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

describe("ImagesToHtml", () => {
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
      const step = new ImagesToHtml(mockStorage, mockLogger);
      assert.ok(step);
    });

    test("accepts optional modelConfig", () => {
      const modelConfig = { model: "gpt-4o", maxTokens: 4000 };
      const step = new ImagesToHtml(mockStorage, mockLogger, modelConfig);
      assert.ok(step);
    });

    test("loads image to HTML prompt", () => {
      const step = new ImagesToHtml(mockStorage, mockLogger);
      assert.ok(step);
      // The prompt should be loaded in constructor
      // We can't directly test the private field, but constructor should not throw
    });
  });

  describe("process", () => {
    test("throws error when image keys are missing from previous step", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: {
            status: "COMPLETED",
            // Missing imageKeys
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new ImagesToHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /No imageKeys found/,
      });
    });

    test("throws error when image is not a buffer", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: {
            status: "COMPLETED",
            imageKeys: ["pipeline/abc123/page-001.png"],
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      // Put a string instead of a buffer
      mockStorage.put("pipeline/abc123/page-001.png", "not a buffer");

      const step = new ImagesToHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /non-buffer image/,
      });
    });

    test("throws error when GITHUB_TOKEN is not set", async () => {
      delete globalThis.process.env.GITHUB_TOKEN;

      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: {
            status: "COMPLETED",
            imageKeys: ["pipeline/abc123/page-001.png"],
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      // Create a valid PNG buffer (minimal valid PNG)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/page-001.png", pngBuffer);

      const step = new ImagesToHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /token not found/i,
      });
    });

    test("logs debug messages during processing", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: {
            status: "COMPLETED",
            imageKeys: ["pipeline/abc123/page-001.png"],
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      // Create a valid buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/page-001.png", pngBuffer);

      const step = new ImagesToHtml(mockStorage, mockLogger);

      // Will fail at LLM call due to fake token
      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });

      // Verify debug logs were created
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(debugLogs.some((l) => l.msg.includes("Processing")));
    });
  });

  describe("STEP_NAME constant", () => {
    test("exports correct step name", () => {
      assert.strictEqual(STEP_NAME, "images-to-html");
    });
  });

  describe("integration behavior", () => {
    test("validates required context properties", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          // Missing pdf-to-images step
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      mockStorage.put("pipeline/abc123/context.json", ingestContext);

      const step = new ImagesToHtml(mockStorage, mockLogger);

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });
    });

    test("extracts target directory correctly", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: {
            status: "COMPLETED",
            imageKeys: ["pipeline/abc123/page-001.png"],
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      // Create a valid buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/page-001.png", pngBuffer);

      const step = new ImagesToHtml(mockStorage, mockLogger);

      // The step will fail at LLM call
      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });

      // Check that processing was logged
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(debugLogs.some((l) => l.msg.includes("Processing image 1")));
    });

    test("uses configured model settings", () => {
      const modelConfig = { model: "gpt-4.1", maxTokens: 6000 };
      const step = new ImagesToHtml(mockStorage, mockLogger, modelConfig);

      assert.strictEqual(step.getModel(), "gpt-4.1");
      assert.strictEqual(step.getMaxTokens(), 6000);
    });

    test("handles multiple images", async () => {
      const ingestContext = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: {
            status: "COMPLETED",
            imageKeys: [
              "pipeline/abc123/page-001.png",
              "pipeline/abc123/page-002.png",
              "pipeline/abc123/page-003.png",
            ],
          },
          [STEP_NAME]: { status: "QUEUED", order: 2 },
        },
      };

      // Create valid buffers for all images
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      mockStorage.put("pipeline/abc123/context.json", ingestContext);
      mockStorage.put("pipeline/abc123/page-001.png", pngBuffer);
      mockStorage.put("pipeline/abc123/page-002.png", pngBuffer);
      mockStorage.put("pipeline/abc123/page-003.png", pngBuffer);

      const step = new ImagesToHtml(mockStorage, mockLogger);

      // Will fail at LLM call on first image
      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });

      // Verify it attempted to process the first image
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(debugLogs.some((l) => l.msg.includes("3 images")));
    });
  });
});
