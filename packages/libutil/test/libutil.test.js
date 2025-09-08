/* eslint-env node */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Module under test
import { Logger, logFactory, ProcessorBase } from "../index.js";

describe("libutil", () => {
  let originalDebug;
  let consoleOutput;
  let originalConsoleError;

  beforeEach(() => {
    originalDebug = process.env.DEBUG;
    consoleOutput = [];
    originalConsoleError = console.error;
    console.error = (message) => consoleOutput.push(message);
  });

  afterEach(() => {
    process.env.DEBUG = originalDebug;
    console.error = originalConsoleError;
  });

  describe("Logger", () => {
    test("creates Logger with namespace", () => {
      const logger = new Logger("test");

      assert.ok(logger instanceof Logger);
      assert.strictEqual(logger.namespace, "test");
    });

    test("validates constructor parameters", () => {
      assert.throws(() => new Logger(), {
        message: /namespace must be a non-empty string/,
      });
      assert.throws(() => new Logger(""), {
        message: /namespace must be a non-empty string/,
      });
      assert.throws(() => new Logger(null), {
        message: /namespace must be a non-empty string/,
      });
    });

    test("enables logging when DEBUG=*", () => {
      process.env.DEBUG = "*";
      const logger = new Logger("test");

      assert.strictEqual(logger.enabled, true);
    });

    test("disables logging when DEBUG is empty", () => {
      process.env.DEBUG = "";
      const logger = new Logger("test");

      assert.strictEqual(logger.enabled, false);
    });

    test("enables logging for exact namespace match", () => {
      process.env.DEBUG = "test,other";
      const logger = new Logger("test");

      assert.strictEqual(logger.enabled, true);
    });

    test("enables logging for wildcard pattern match", () => {
      process.env.DEBUG = "test*";
      const logger = new Logger("test:service");

      assert.strictEqual(logger.enabled, true);
    });

    test("disables logging for non-matching namespace", () => {
      process.env.DEBUG = "other";
      const logger = new Logger("test");

      assert.strictEqual(logger.enabled, false);
    });

    test("logs debug message when enabled", () => {
      process.env.DEBUG = "test";
      const logger = new Logger("test");

      logger.debug("Test message");

      assert.strictEqual(consoleOutput.length, 1);
      assert.ok(consoleOutput[0].includes("test: Test message"));
    });

    test("does not log when disabled", () => {
      process.env.DEBUG = "other";
      const logger = new Logger("test");

      logger.debug("Test message");

      assert.strictEqual(consoleOutput.length, 0);
    });

    test("logs message with data object", () => {
      process.env.DEBUG = "test";
      const logger = new Logger("test");

      logger.debug("Processing", { items: "50/200", retry: "2/3" });

      assert.strictEqual(consoleOutput.length, 1);
      assert.ok(
        consoleOutput[0].includes("test: Processing items=50/200 retry=2/3"),
      );
    });

    test("handles empty data object", () => {
      process.env.DEBUG = "test";
      const logger = new Logger("test");

      logger.debug("Test message", {});

      assert.strictEqual(consoleOutput.length, 1);
      assert.ok(consoleOutput[0].includes("test: Test message"));
    });

    test("includes timestamp in log output", () => {
      process.env.DEBUG = "test";
      const logger = new Logger("test");

      logger.debug("Test message");

      assert.strictEqual(consoleOutput.length, 1);
      assert.ok(consoleOutput[0].match(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/));
    });
  });

  describe("logFactory", () => {
    test("creates Logger instance", () => {
      const logger = logFactory("test");

      assert.ok(logger instanceof Logger);
      assert.strictEqual(logger.namespace, "test");
    });

    test("passes through namespace validation", () => {
      assert.throws(() => logFactory(""), {
        message: /namespace must be a non-empty string/,
      });
    });
  });

  describe("ProcessorBase", () => {
    let mockLogger;

    beforeEach(() => {
      mockLogger = {
        debug: () => {}, // No-op logger for tests
      };
    });

    describe("constructor", () => {
      test("creates ProcessorBase with logger and batch size", () => {
        const processor = new ProcessorBase(mockLogger, 5);

        assert.ok(processor instanceof ProcessorBase);
      });

      test("validates logger parameter", () => {
        assert.throws(() => new ProcessorBase(), {
          message: /logger is required/,
        });
        assert.throws(() => new ProcessorBase(null), {
          message: /logger is required/,
        });
      });

      test("validates batch size parameter", () => {
        assert.throws(() => new ProcessorBase(mockLogger, 0), {
          message: /batchSize must be a positive number/,
        });
        assert.throws(() => new ProcessorBase(mockLogger, -1), {
          message: /batchSize must be a positive number/,
        });
        assert.throws(() => new ProcessorBase(mockLogger, "invalid"), {
          message: /batchSize must be a positive number/,
        });
      });

      test("uses default batch size when not provided", () => {
        const processor = new ProcessorBase(mockLogger);
        // Test passes if no error is thrown
        assert.ok(processor instanceof ProcessorBase);
      });
    });

    describe("process", () => {
      test("validates items parameter", async () => {
        const processor = new ProcessorBase(mockLogger, 2);

        await assert.rejects(() => processor.process("not-array"), {
          message: /items must be an array/,
        });
      });

      test("handles empty array", async () => {
        const processor = new ProcessorBase(mockLogger, 2);

        // Should not throw
        await processor.process([]);
      });

      test("calls processItem for each item", async () => {
        class TestProcessor extends ProcessorBase {
          constructor(logger) {
            super(logger, 2);
            this.processedItems = [];
          }

          async processItem(item, itemIndex, globalIndex) {
            this.processedItems.push({ item, itemIndex, globalIndex });
            return `processed-${item}`;
          }
        }

        const processor = new TestProcessor(mockLogger);
        await processor.process(["a", "b", "c", "d"]);

        assert.strictEqual(processor.processedItems.length, 4);
        assert.deepStrictEqual(processor.processedItems[0], {
          item: "a",
          itemIndex: 0,
          globalIndex: 0,
        });
        assert.deepStrictEqual(processor.processedItems[1], {
          item: "b",
          itemIndex: 1,
          globalIndex: 1,
        });
        assert.deepStrictEqual(processor.processedItems[2], {
          item: "c",
          itemIndex: 0,
          globalIndex: 2,
        });
        assert.deepStrictEqual(processor.processedItems[3], {
          item: "d",
          itemIndex: 1,
          globalIndex: 3,
        });
      });

      test("continues processing when individual items fail", async () => {
        class TestProcessor extends ProcessorBase {
          constructor(logger) {
            super(logger, 3);
            this.processedItems = [];
          }

          async processItem(item) {
            if (item === "fail") {
              throw new Error("Simulated failure");
            }
            this.processedItems.push(item);
            return `processed-${item}`;
          }
        }

        const processor = new TestProcessor(mockLogger);
        await processor.process(["a", "fail", "b", "c"]);

        // Should have processed all items except the failing one
        assert.deepStrictEqual(processor.processedItems, ["a", "b", "c"]);
      });
    });

    describe("processItem", () => {
      test("throws error when not implemented", async () => {
        const processor = new ProcessorBase(mockLogger, 2);

        await assert.rejects(() => processor.processItem("item", 0, 0), {
          message: /processItem must be implemented by subclass/,
        });
      });
    });
  });
});
