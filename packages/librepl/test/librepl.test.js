/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { Repl } from "../index.js";

describe("librepl", () => {
  describe("Repl", () => {
    let mockReadline, mockProcess, mockFormatter, repl;

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
        stdin: {
          isTTY: true,
          setEncoding: () => {},
          [Symbol.asyncIterator]: async function* () {
            yield "test input\n";
          },
        },
        stdout: {},
        exit: () => {},
      };

      // Mock formatter
      mockFormatter = {
        format: (text) => `formatted: ${text}`,
      };

      repl = new Repl(mockReadline, mockProcess, mockFormatter, {
        prompt: "test> ",
        onLine: async (input) => `You said: ${input}`,
        commands: {
          test: {
            help: "Test command",
            handler: () => console.log("Test executed"),
          },
        },
        state: {
          testVar: {
            initial: "default",
            description: "Test variable",
          },
        },
      });
    });

    test("creates repl with dependencies", () => {
      assert.strictEqual(repl.prompt, "test> ");
      assert.strictEqual(typeof repl.onLine, "function");
      assert.strictEqual(repl.readline, mockReadline);
      assert.strictEqual(repl.process, mockProcess);
      assert.strictEqual(repl.formatter, mockFormatter);
    });

    test("initializes state commands", () => {
      assert(repl.stateCommands.testVar);
      assert.strictEqual(repl.stateCommands.testVar.help, "Test variable");
      assert.strictEqual(repl.stateGetters.testVar(), "default");
    });

    test("creates built-in commands", () => {
      assert(repl.builtInCommands.help);
      assert(repl.builtInCommands.clear);
      assert(repl.builtInCommands.exit);
    });

    test("combines all commands", () => {
      assert(repl.allCommands.help); // Built-in
      assert(repl.allCommands.testVar); // State
      assert(repl.allCommands.test); // Custom
    });

    test("executes onLine handler with formatter", async () => {
      let output = "";
      console.log = (text) => {
        output = text;
      };

      await repl.safeOnLine("hello");
      assert(output.includes("formatted: You said: hello"));
    });

    test("handles onLine errors gracefully", async () => {
      repl.onLine = async () => {
        throw new Error("Test error");
      };

      let errorOutput = "";
      console.error = (...args) => {
        errorOutput = args.join(" ");
      };

      await repl.safeOnLine("test");
      assert(errorOutput.includes("Error:"));
    });

    test("creates state command correctly", () => {
      const { command, get } = repl.createStateCommand(
        "test",
        "initial",
        "desc",
      );

      assert.strictEqual(command.help, "desc");
      assert.strictEqual(get(), "initial");

      command.handler(["newValue"]);
      assert.strictEqual(get(), "newValue");
    });

    test("handles stdin for non-interactive mode", async () => {
      mockProcess.stdin.isTTY = false;

      let output = "";
      console.log = (text) => {
        output = text;
      };

      await repl.handleStdin();
      assert(output.includes("You said: test input"));
    });
  });
});
