// Standard imports - always first
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";

// Module under test - second section
import { ImagesToHtml, STEP_NAME } from "../steps/images-to-html.js";
import { STEP_NAME as PDF_TO_IMAGES_STEP } from "../steps/pdf-to-images.js";
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
    debug: (appId, msg, attributes) =>
      logs.push({ level: "debug", appId, msg, attributes }),
    info: (appId, msg, attributes) =>
      logs.push({ level: "info", appId, msg, attributes }),
    error: (appId, msg, attributes) =>
      logs.push({ level: "error", appId, msg, attributes }),
    logs,
  };
}

// Mock config for testing
/**
 * Creates a mock Config instance for testing.
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock config with llmToken, llmBaseUrl, embeddingBaseUrl methods
 */
function createMockConfig(overrides = {}) {
  return {
    llmToken: () => "test_token_123",
    llmBaseUrl: () => "https://models.github.ai/inference",
    embeddingBaseUrl: () => "http://localhost:8090",
    ...overrides,
  };
}

describe("ImagesToHtml", () => {
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
      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
      assert.ok(step);
    });

    test("accepts optional modelConfig", () => {
      const modelConfig = { model: "gpt-4o", maxTokens: 4000 };
      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        modelConfig,
        mockConfig,
        promptLoader,
      );
      assert.ok(step);
    });

    test("loads image to HTML prompt", () => {
      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );
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

      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /No image source found/,
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

      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );

      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
        message: /non-buffer image/,
      });
    });

    test("throws error when LLM token is not set", async () => {
      // Create config with no token
      const noTokenConfig = createMockConfig({ llmToken: () => null });

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

      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        noTokenConfig,
        promptLoader,
      );

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

      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );

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

      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );

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

      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );

      // The step will fail at LLM call
      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });

      // Check that processing was logged
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(
        debugLogs.some(
          (l) => l.msg === "Processing image" && l.attributes?.page === 1,
        ),
      );
    });

    test("uses configured model settings", () => {
      const modelConfig = { model: "gpt-4.1", maxTokens: 6000 };
      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        modelConfig,
        mockConfig,
        promptLoader,
      );

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

      const step = new ImagesToHtml(
        mockStorage,
        mockLogger,
        {},
        mockConfig,
        promptLoader,
      );

      // Will fail at LLM call on first image
      await assert.rejects(() => step.process("pipeline/abc123/context.json"), {
        name: "Error",
      });

      // Verify it attempted to process the first image
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(
        debugLogs.some(
          (l) =>
            l.msg === "Processing images to HTML" && l.attributes?.count === 3,
        ),
      );
    });
  });
});
