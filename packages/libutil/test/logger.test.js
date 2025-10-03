/* eslint-env node */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Module under test
import { Logger, logFactory } from "../index.js";

describe("Logger", () => {
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
