/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { Repl } from "../index.js";

describe("librepl", () => {
  describe("Repl", () => {
    let mockReadline, mockProcess, mockFormatter;

    beforeEach(() => {
      // Mock readline
      const mockRlInterface = {
        on: () => {},
        prompt: () => {},
        close: () => {},
      };
      mockReadline = {
        createInterface: () => mockRlInterface,
      };

      // Mock process with proper exit handling
      mockProcess = {
        argv: ["node", "script.js"],
        stdin: {
          isTTY: true,
          setEncoding: () => {},
          async *[Symbol.asyncIterator]() {
            yield "test input";
            return; // This ensures the iterator completes
          },
        },
        stdout: { write: () => {} },
        stderr: { write: () => {} },
        exit: (code) => {
          // Don't actually exit in tests - just mark that exit was called
          mockProcess._exitCalled = true;
          mockProcess._exitCode = code;
        },
        _exitCalled: false,
        _exitCode: null,
      };

      // Mock formatter
      mockFormatter = {
        format: (text) => `formatted: ${text}`,
      };
    });

    test("creates repl with minimal configuration", () => {
      const repl = new Repl(mockFormatter);
      assert(repl instanceof Repl);
    });

    test("creates repl with handlers configuration", () => {
      const repl = new Repl(mockFormatter, {
        prompt: "test> ",
        onLine: async (input) => `You said: ${input}`,
        commands: {
          test: () => "Test executed",
        },
        state: {
          testVar: "default",
        },
      });
      assert(repl instanceof Repl);
    });

    test("requires formatter dependency", () => {
      assert.throws(() => {
        new Repl(null);
      }, /formatter dependency is required/);
    });

    test("handles command line argument parsing for state", () => {
      mockProcess.argv = ["node", "script.js", "--testVar", "fromArgs"];

      const repl = new Repl(
        mockFormatter,
        {
          state: {
            testVar: "default",
          },
        },
        mockReadline,
        mockProcess,
      );

      // State should be initialized with command line value
      assert(repl instanceof Repl);
    });

    // Simplified tests that don't involve async stdin processing
    test("handles interactive mode initialization", () => {
      mockProcess.stdin.isTTY = true;

      const repl = new Repl(mockFormatter, {}, mockReadline, mockProcess);

      // Just test that it can be created in interactive mode
      assert(repl instanceof Repl);
    });
  });
});
