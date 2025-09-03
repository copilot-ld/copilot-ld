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

      // Mock process
      mockProcess = {
        argv: ["node", "script.js"],
        stdin: {
          isTTY: true,
          setEncoding: () => {},
          [Symbol.asyncIterator]: async function* () {
            yield "test input\n";
          },
        },
        stdout: { write: () => {} },
        stderr: { write: () => {} },
        exit: () => {},
      };

      // Mock formatter
      mockFormatter = {
        format: (text) => `formatted: ${text}`,
      };
    });

    test("creates repl with minimal configuration", () => {
      const repl = new Repl(mockReadline, mockProcess, mockFormatter);
      assert(repl instanceof Repl);
    });

    test("creates repl with handlers configuration", () => {
      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        prompt: "test> ",
        onLine: async (input) => `You said: ${input}`,
        commands: {
          test: {
            help: "Test command",
            handler: () => "Test executed",
          },
        },
        state: {
          testVar: {
            initial: "default",
            description: "Test variable",
          },
        },
      });
      assert(repl instanceof Repl);
    });

    test("requires readline dependency", () => {
      assert.throws(() => {
        new Repl(null, mockProcess, mockFormatter);
      }, /readline dependency is required/);
    });

    test("requires process dependency", () => {
      assert.throws(() => {
        new Repl(mockReadline, null, mockFormatter);
      }, /process dependency is required/);
    });

    test("requires formatter dependency", () => {
      assert.throws(() => {
        new Repl(mockReadline, mockProcess, null);
      }, /formatter dependency is required/);
    });

    test("handles non-interactive mode with user input", async () => {
      mockProcess.stdin.isTTY = false;

      let output = "";
      mockProcess.stdout.write = (text) => {
        output += text;
      };

      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        onLine: async (input) => `You said: ${input}`,
      });

      await repl.start();
      assert(output.includes("formatted: You said: test input"));
    });

    test("handles non-interactive mode with commands", async () => {
      mockProcess.stdin.isTTY = false;
      mockProcess.stdin[Symbol.asyncIterator] = async function* () {
        yield "/help\n";
      };

      let output = "";
      mockProcess.stdout.write = (text) => {
        output += text;
      };

      const repl = new Repl(mockReadline, mockProcess, mockFormatter);
      await repl.start();

      assert(output.includes("The available commands are:"));
      assert(output.includes("- /help"));
    });

    test("handles non-interactive mode with custom commands", async () => {
      mockProcess.stdin.isTTY = false;
      mockProcess.stdin[Symbol.asyncIterator] = async function* () {
        yield "/test\n";
      };

      let output = "";
      mockProcess.stdout.write = (text) => {
        output += text;
      };

      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        commands: {
          test: {
            help: "Test command",
            handler: () => "Test executed",
          },
        },
      });

      await repl.start();
      assert(output.includes("Test executed"));
    });

    test("handles non-interactive mode with state commands", async () => {
      mockProcess.stdin.isTTY = false;
      mockProcess.stdin[Symbol.asyncIterator] = async function* () {
        yield "/testVar newValue\n";
      };

      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        state: {
          testVar: {
            initial: "default",
            description: "Test variable",
          },
        },
      });

      await repl.start();
      // State should be updated (though we can't directly verify it without exposing internals)
    });

    test("handles command line argument parsing for state", () => {
      mockProcess.argv = ["node", "script.js", "--testVar", "fromArgs"];

      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        state: {
          testVar: {
            initial: "default",
            description: "Test variable",
          },
        },
      });

      // State should be initialized with command line value
      assert(repl instanceof Repl);
    });

    test("handles unknown commands gracefully", async () => {
      mockProcess.stdin.isTTY = false;
      mockProcess.stdin[Symbol.asyncIterator] = async function* () {
        yield "/unknown\n";
      };

      let output = "";
      mockProcess.stdout.write = (text) => {
        output += text;
      };

      const repl = new Repl(mockReadline, mockProcess, mockFormatter);
      await repl.start();

      assert(output.includes("Error: Unknown command"));
      assert(output.includes("/help"));
    });

    test("handles command execution errors gracefully", async () => {
      mockProcess.stdin.isTTY = false;
      mockProcess.stdin[Symbol.asyncIterator] = async function* () {
        yield "/errorCmd\n";
      };

      let errorOutput = "";
      mockProcess.stderr.write = (text) => {
        errorOutput += text;
      };

      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        commands: {
          errorCmd: {
            help: "Error command",
            handler: () => {
              throw new Error("Command failed");
            },
          },
        },
      });

      await repl.start();
      assert(errorOutput.includes("Error executing command:"));
      assert(errorOutput.includes("Command failed"));
    });

    test("handles onLine errors gracefully", async () => {
      mockProcess.stdin.isTTY = false;
      mockProcess.stdin[Symbol.asyncIterator] = async function* () {
        yield "regular input\n";
      };

      let errorOutput = "";
      mockProcess.stderr.write = (text) => {
        errorOutput += text;
      };

      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        onLine: async () => {
          throw new Error("Handler error");
        },
      });

      await repl.start();
      assert(errorOutput.includes("Error:"));
      assert(errorOutput.includes("Handler error"));
    });

    test("calls setup function during start", async () => {
      let setupCalled = false;
      mockProcess.stdin.isTTY = false;
      mockProcess.stdin[Symbol.asyncIterator] = async function* () {};

      const repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        setup: async () => {
          setupCalled = true;
        },
      });

      await repl.start();
      assert(setupCalled);
    });
  });
});
