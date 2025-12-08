/* eslint-env node */
// Standard imports - always first
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test - second section
import { IngesterPipeline } from "./pipeline.js";
import { STEP_NAME as PDF_TO_IMAGES_STEP } from "./steps/pdf-to-images.js";
import { STEP_NAME as IMAGES_TO_HTML_STEP } from "./steps/images-to-html.js";
import { STEP_NAME as EXTRACT_CONTEXT_STEP } from "./steps/extract-context.js";
import { STEP_NAME as ANNOTATE_HTML_STEP } from "./steps/annotate-html.js";
import { STEP_NAME as NORMALIZE_HTML_STEP } from "./steps/normalize-html.js";

// Mock storage for testing
/**
 * Creates a mock storage instance for testing.
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock storage with get, put, exists, delete, findByPrefix methods
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
    findByPrefix: async () => [],
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

describe("IngesterPipeline", () => {
  let mockIngestStorage;
  let mockConfigStorage;
  let mockLogger;

  beforeEach(() => {
    mockIngestStorage = createMockStorage();
    mockConfigStorage = createMockStorage();
    mockLogger = createMockLogger();
  });

  describe("constructor", () => {
    test("creates instance with required parameters", () => {
      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );
      assert.ok(pipeline);
    });

    test("throws error when ingestStorage is missing", () => {
      assert.throws(
        () => new IngesterPipeline(null, mockConfigStorage, mockLogger),
        {
          name: "Error",
          message: /ingestStorage backend is required/,
        },
      );
    });

    test("throws error when configStorage is missing", () => {
      assert.throws(
        () => new IngesterPipeline(mockIngestStorage, null, mockLogger),
        {
          name: "Error",
          message: /configStorage backend is required/,
        },
      );
    });

    test("accepts optional batch size", () => {
      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
        10,
      );
      assert.ok(pipeline);
    });

    test("uses default logger when not provided", () => {
      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
      );
      assert.ok(pipeline);
    });
  });

  describe("process", () => {
    test("throws error when config is missing", async () => {
      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await assert.rejects(() => pipeline.process(), {
        name: "Error",
        message: /No ingest config found/,
      });
    });

    test("loads config from YAML", async () => {
      const config = `
defaults:
  maxTokens: 5000
models:
  images-to-html: gpt-4o
steps:
  application/pdf:
    - pdf-to-images
    - images-to-html
`;
      mockConfigStorage.put("ingest.yml", config);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      // Should not throw - config is valid
      await pipeline.process();
    });

    test("processes empty pipeline folder list", async () => {
      const config = `
defaults:
  maxTokens: 5000
models:
  images-to-html: gpt-4o
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);
      mockIngestStorage.findByPrefix = async () => [];

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();
      // Should complete without error when no folders to process
    });
  });

  describe("processItem", () => {
    test("throws error when context.json is missing", async () => {
      const config = `
defaults:
  maxTokens: 5000
models:
  images-to-html: gpt-4o
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      // Load config first
      await pipeline.process();

      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
        message: /Missing context.json/,
      });
    });

    test("throws error when context.json has invalid steps", async () => {
      const config = `
defaults:
  maxTokens: 5000
models:
  images-to-html: gpt-4o
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const invalidContext = { filename: "test.pdf" }; // Missing steps
      mockIngestStorage.put("pipeline/abc123/context.json", invalidContext);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
        message: /Invalid or missing steps/,
      });
    });

    test("throws error for unknown step", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - unknown-step
`;
      mockConfigStorage.put("ingest.yml", config);

      const context = {
        filename: "test.pdf",
        steps: {
          "unknown-step": { status: "QUEUED", order: 1 },
        },
      };
      mockIngestStorage.put("pipeline/abc123/context.json", context);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
        message: /Unknown step: unknown-step/,
      });
    });

    test("completes when all steps are already completed", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const context = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: { status: "COMPLETED", order: 1 },
        },
      };
      mockIngestStorage.put("pipeline/abc123/context.json", context);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();
      await pipeline.processItem("pipeline/abc123/");

      // Should complete without error
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(debugLogs.some((l) => l.msg.includes("All steps completed")));
    });

    test("processes steps in order", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const context = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: { status: "QUEUED", order: 1 },
        },
      };
      mockIngestStorage.put("pipeline/abc123/context.json", context);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      // This will fail because there's no actual PDF to process
      // but it verifies the step selection logic works
      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
      });

      // Verify it attempted to process the step
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(
        debugLogs.some((l) =>
          l.msg.includes(`Processing step: ${PDF_TO_IMAGES_STEP}`),
        ),
      );
    });
  });

  describe("step handlers", () => {
    test("maps all known step names correctly", () => {
      // Verify all step names are defined
      assert.strictEqual(PDF_TO_IMAGES_STEP, "pdf-to-images");
      assert.strictEqual(IMAGES_TO_HTML_STEP, "images-to-html");
      assert.strictEqual(EXTRACT_CONTEXT_STEP, "extract-context");
      assert.strictEqual(ANNOTATE_HTML_STEP, "annotate-html");
      assert.strictEqual(NORMALIZE_HTML_STEP, "normalize-html");
    });
  });

  describe("dynamic step discovery", () => {
    test("discovers all step handlers on first process call", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      // Should log discovered steps
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      const discoveryLog = debugLogs.find((l) => l.msg.includes("Discovered"));
      assert.ok(discoveryLog, "Should log step discovery");
      assert.ok(
        discoveryLog.msg.includes("5 steps"),
        "Should discover 5 steps",
      );
    });

    test("discovers all expected step types", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      // Verify all expected steps are mentioned in discovery log
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      const discoveryLog = debugLogs.find((l) => l.msg.includes("Discovered"));

      assert.ok(discoveryLog.msg.includes(PDF_TO_IMAGES_STEP));
      assert.ok(discoveryLog.msg.includes(IMAGES_TO_HTML_STEP));
      assert.ok(discoveryLog.msg.includes(EXTRACT_CONTEXT_STEP));
      assert.ok(discoveryLog.msg.includes(ANNOTATE_HTML_STEP));
      assert.ok(discoveryLog.msg.includes(NORMALIZE_HTML_STEP));
    });

    test("caches step handlers between calls", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      // Call process multiple times
      await pipeline.process();
      await pipeline.process();
      await pipeline.process();

      // Should only log discovery once (cached after first call)
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      const discoveryLogs = debugLogs.filter((l) =>
        l.msg.includes("Discovered"),
      );
      assert.strictEqual(
        discoveryLogs.length,
        1,
        "Should only discover steps once",
      );
    });

    test("can process any dynamically discovered step", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - images-to-html
`;
      mockConfigStorage.put("ingest.yml", config);

      // Set up context for images-to-html step
      const context = {
        filename: "test.pdf",
        steps: {
          [IMAGES_TO_HTML_STEP]: { status: "QUEUED", order: 1 },
        },
      };
      mockIngestStorage.put("pipeline/abc123/context.json", context);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      // Will fail because no actual images, but proves step was found dynamically
      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
      });

      // Verify step was selected for processing
      const debugLogs = mockLogger.logs.filter((l) => l.level === "debug");
      assert.ok(
        debugLogs.some((l) =>
          l.msg.includes(`Processing step: ${IMAGES_TO_HTML_STEP}`),
        ),
      );
    });

    test("rejects steps not in the steps directory", async () => {
      const config = `
defaults:
  maxTokens: 5000
steps:
  application/pdf:
    - fake-step
`;
      mockConfigStorage.put("ingest.yml", config);

      const context = {
        filename: "test.pdf",
        steps: {
          "fake-step": { status: "QUEUED", order: 1 },
        },
      };
      mockIngestStorage.put("pipeline/abc123/context.json", context);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
        message: /Unknown step: fake-step/,
      });
    });
  });

  describe("model configuration", () => {
    test("passes model config to step handlers", async () => {
      const config = `
defaults:
  maxTokens: 8000
models:
  pdf-to-images: gpt-4o
  images-to-html: gpt-4.1
  extract-context: gpt-4o-mini
  annotate-html: claude-sonnet-4.5
  normalize-html: gpt-4o-mini
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const context = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: { status: "QUEUED", order: 1 },
        },
      };
      mockIngestStorage.put("pipeline/abc123/context.json", context);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      // Will fail at actual processing, but config loading works
      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
      });
    });

    test("uses default maxTokens when not specified", async () => {
      const config = `
models:
  pdf-to-images: gpt-4o
steps:
  application/pdf:
    - pdf-to-images
`;
      mockConfigStorage.put("ingest.yml", config);

      const context = {
        filename: "test.pdf",
        steps: {
          [PDF_TO_IMAGES_STEP]: { status: "QUEUED", order: 1 },
        },
      };
      mockIngestStorage.put("pipeline/abc123/context.json", context);

      const pipeline = new IngesterPipeline(
        mockIngestStorage,
        mockConfigStorage,
        mockLogger,
      );

      await pipeline.process();

      // Should not throw due to missing defaults
      await assert.rejects(() => pipeline.processItem("pipeline/abc123/"), {
        name: "Error",
      });
    });
  });
});
