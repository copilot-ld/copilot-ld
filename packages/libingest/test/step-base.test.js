// Standard imports - always first
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Module under test - second section
import {
  StepBase,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
} from "../steps/step-base.js";

// Mock storage for testing
/**
 * Creates a mock storage instance for testing.
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock storage with get, put, exists, delete methods
 */
function createMockStorage(overrides = {}) {
  return {
    get: async () => null,
    put: async () => {},
    exists: async () => false,
    delete: async () => {},
    ...overrides,
  };
}

// Mock logger for testing
/**
 * Creates a mock logger instance for testing.
 * @returns {object} Mock logger with debug, info, error methods
 */
function createMockLogger() {
  return {
    debug: () => {},
    info: () => {},
    error: () => {},
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

describe("StepBase", () => {
  let mockStorage;
  let mockLogger;
  let mockConfig;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
  });

  describe("constructor", () => {
    test("creates instance with required parameters", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.ok(step);
      assert.strictEqual(step.ingestStorage, mockStorage);
      assert.strictEqual(step.logger, mockLogger);
    });

    test("throws error when ingestStorage is missing", () => {
      assert.throws(() => new StepBase(null, mockLogger, {}, mockConfig), {
        name: "Error",
        message: "ingestStorage is required",
      });
    });

    test("throws error when logger is missing", () => {
      assert.throws(() => new StepBase(mockStorage, null, {}, mockConfig), {
        name: "Error",
        message: "logger is required",
      });
    });

    test("throws error when config is missing", () => {
      assert.throws(() => new StepBase(mockStorage, mockLogger, {}), {
        name: "Error",
        message: "config is required",
      });
    });

    test("accepts modelConfig parameter", () => {
      const modelConfig = { model: "gpt-4", maxTokens: 1000 };
      const step = new StepBase(
        mockStorage,
        mockLogger,
        modelConfig,
        mockConfig,
      );

      assert.strictEqual(step.getModel(), "gpt-4");
      assert.strictEqual(step.getMaxTokens(), 1000);
    });
  });

  describe("getModel", () => {
    test("returns configured model when set", () => {
      const modelConfig = { model: "gpt-4-turbo" };
      const step = new StepBase(
        mockStorage,
        mockLogger,
        modelConfig,
        mockConfig,
      );

      assert.strictEqual(step.getModel(), "gpt-4-turbo");
    });

    test("returns default model when not configured", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.strictEqual(step.getModel(), DEFAULT_MODEL);
    });

    test("returns default model when modelConfig is empty", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.strictEqual(step.getModel(), DEFAULT_MODEL);
    });
  });

  describe("getMaxTokens", () => {
    test("returns configured maxTokens when set", () => {
      const modelConfig = { maxTokens: 2000 };
      const step = new StepBase(
        mockStorage,
        mockLogger,
        modelConfig,
        mockConfig,
      );

      assert.strictEqual(step.getMaxTokens(), 2000);
    });

    test("returns default maxTokens when not configured", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.strictEqual(step.getMaxTokens(), DEFAULT_MAX_TOKENS);
    });

    test("returns default maxTokens when modelConfig is empty", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.strictEqual(step.getMaxTokens(), DEFAULT_MAX_TOKENS);
    });
  });

  describe("loadPrompt", () => {
    let tempDir;

    beforeEach(() => {
      tempDir = join(tmpdir(), `step-base-test-${Date.now()}`);
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test("loads prompt file successfully", () => {
      const promptContent = "This is a test prompt";
      const promptFile = "test-prompt.md";
      const promptPath = join(tempDir, promptFile);
      writeFileSync(promptPath, promptContent, "utf-8");

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      const result = step.loadPrompt(promptFile, tempDir);

      assert.strictEqual(result, promptContent);
    });

    test("throws error when promptName is missing", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.throws(() => step.loadPrompt(null, tempDir), {
        name: "Error",
        message: "promptName is required",
      });
    });

    test("throws error when baseDir is missing", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.throws(() => step.loadPrompt("test.md", null), {
        name: "Error",
        message: "baseDir is required",
      });
    });

    test("throws error when prompt file does not exist", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.throws(() => step.loadPrompt("non-existent.md", tempDir), {
        name: "Error",
        message: /Prompt file not found/,
      });
    });
  });

  describe("process", () => {
    test("throws error when called on base class", async () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      await assert.rejects(() => step.process("test-key"), {
        name: "Error",
        message: "process() must be implemented by subclass",
      });
    });
  });

  describe("loadIngestContext", () => {
    test("loads and returns valid context", async () => {
      const mockContext = {
        steps: { "test-step": { status: "QUEUED" } },
        originalName: "test.pdf",
      };
      mockStorage.get = async () => mockContext;

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      const result = await step.loadIngestContext(
        "pipeline/abc123/context.json",
      );

      assert.deepStrictEqual(result, mockContext);
    });

    test("throws error when context is null", async () => {
      mockStorage.get = async () => null;

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      await assert.rejects(
        () => step.loadIngestContext("pipeline/abc123/context.json"),
        {
          name: "Error",
          message: /Invalid ingest context for key/,
        },
      );
    });

    test("throws error when context is not an object", async () => {
      mockStorage.get = async () => "invalid";

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      await assert.rejects(
        () => step.loadIngestContext("pipeline/abc123/context.json"),
        {
          name: "Error",
          message: /Invalid ingest context for key/,
        },
      );
    });
  });

  describe("getStep", () => {
    test("returns step metadata when step exists", () => {
      const ingestContext = {
        steps: {
          "pdf-to-images": { status: "QUEUED", order: 1 },
        },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      const result = step.getStep(ingestContext, "pdf-to-images", "test-key");

      assert.deepStrictEqual(result, { status: "QUEUED", order: 1 });
    });

    test("throws error when step does not exist", () => {
      const ingestContext = {
        steps: {
          "pdf-to-images": { status: "QUEUED" },
        },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.throws(
        () => step.getStep(ingestContext, "non-existent-step", "test-key"),
        {
          name: "Error",
          message: /Step "non-existent-step" not found in the context/,
        },
      );
    });
  });

  describe("getTargetDir", () => {
    test("extracts directory from context key", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      const result = step.getTargetDir("pipeline/abc123/context.json");

      assert.strictEqual(result, "pipeline/abc123");
    });

    test("handles nested paths", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      const result = step.getTargetDir(
        "data/ingest/pipeline/xyz789/context.json",
      );

      assert.strictEqual(result, "data/ingest/pipeline/xyz789");
    });

    test("handles single directory", () => {
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      const result = step.getTargetDir("context.json");

      assert.strictEqual(result, ".");
    });
  });

  describe("saveIngestContext", () => {
    test("saves context with updated timestamp", async () => {
      let savedKey;
      let savedData;
      mockStorage.put = async (key, data) => {
        savedKey = key;
        savedData = data;
      };

      const ingestContext = {
        steps: { "test-step": { status: "QUEUED" } },
        originalName: "test.pdf",
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      await step.saveIngestContext(
        "pipeline/abc123/context.json",
        ingestContext,
      );

      assert.strictEqual(savedKey, "pipeline/abc123/context.json");
      assert.ok(ingestContext.lastUpdate);
      assert.ok(savedData.includes('"lastUpdate"'));
      assert.ok(savedData.includes('"test-step"'));
    });

    test("formats JSON with proper indentation", async () => {
      let savedData;
      mockStorage.put = async (key, data) => {
        savedData = data;
      };

      const ingestContext = { steps: {} };
      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      await step.saveIngestContext("test-key", ingestContext);

      const parsed = JSON.parse(savedData);
      assert.ok(savedData.includes("\n"));
      assert.ok(parsed);
    });
  });

  describe("completeStep", () => {
    test("marks step as completed and saves context", async () => {
      let savedContext;
      mockStorage.put = async (key, data) => {
        savedContext = JSON.parse(data);
      };

      const stepMetadata = { status: "QUEUED", order: 1 };
      const ingestContext = {
        steps: { "test-step": stepMetadata },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      await step.completeStep("test-key", ingestContext, stepMetadata);

      assert.strictEqual(stepMetadata.status, "COMPLETED");
      assert.strictEqual(savedContext.steps["test-step"].status, "COMPLETED");
    });

    test("applies additional updates to step", async () => {
      let _savedContext;
      mockStorage.put = async (key, data) => {
        _savedContext = JSON.parse(data);
      };

      const stepMetadata = { status: "QUEUED", order: 1 };
      const ingestContext = {
        steps: { "test-step": stepMetadata },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      await step.completeStep("test-key", ingestContext, stepMetadata, {
        imageKeys: ["image1.png", "image2.png"],
        pageCount: 2,
      });

      assert.strictEqual(stepMetadata.status, "COMPLETED");
      assert.deepStrictEqual(stepMetadata.imageKeys, [
        "image1.png",
        "image2.png",
      ]);
      assert.strictEqual(stepMetadata.pageCount, 2);
    });

    test("updates lastUpdate timestamp", async () => {
      let savedContext;
      mockStorage.put = async (key, data) => {
        savedContext = JSON.parse(data);
      };

      const stepMetadata = { status: "QUEUED" };
      const ingestContext = { steps: { "test-step": stepMetadata } };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      await step.completeStep("test-key", ingestContext, stepMetadata);

      assert.ok(savedContext.lastUpdate);
      assert.ok(new Date(savedContext.lastUpdate).getTime() > 0);
    });
  });

  describe("getPreviousStepData", () => {
    test("returns property value when step and property exist", () => {
      const ingestContext = {
        steps: {
          "pdf-to-images": {
            status: "COMPLETED",
            imageKeys: ["image1.png", "image2.png"],
          },
        },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);
      const result = step.getPreviousStepData(
        ingestContext,
        "pdf-to-images",
        "imageKeys",
        "test-key",
      );

      assert.deepStrictEqual(result, ["image1.png", "image2.png"]);
    });

    test("throws error when step does not exist", () => {
      const ingestContext = {
        steps: {
          "pdf-to-images": { status: "COMPLETED" },
        },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.throws(
        () =>
          step.getPreviousStepData(
            ingestContext,
            "non-existent-step",
            "imageKeys",
            "test-key",
          ),
        {
          name: "Error",
          message: /No imageKeys found from non-existent-step step/,
        },
      );
    });

    test("throws error when property does not exist", () => {
      const ingestContext = {
        steps: {
          "pdf-to-images": { status: "COMPLETED" },
        },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      assert.throws(
        () =>
          step.getPreviousStepData(
            ingestContext,
            "pdf-to-images",
            "imageKeys",
            "test-key",
          ),
        {
          name: "Error",
          message: /No imageKeys found from pdf-to-images step/,
        },
      );
    });

    test("handles falsy values correctly", () => {
      const ingestContext = {
        steps: {
          "test-step": {
            status: "COMPLETED",
            count: 0,
            enabled: false,
          },
        },
      };

      const step = new StepBase(mockStorage, mockLogger, {}, mockConfig);

      // Should return 0, not throw
      const count = step.getPreviousStepData(
        ingestContext,
        "test-step",
        "count",
        "test-key",
      );
      assert.strictEqual(count, 0);

      // Should return false, not throw
      const enabled = step.getPreviousStepData(
        ingestContext,
        "test-step",
        "enabled",
        "test-key",
      );
      assert.strictEqual(enabled, false);
    });
  });
});
