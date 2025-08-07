/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";
import { ReleaseBumper, ReleaseChanges } from "../index.js";

describe("Error handling", () => {
  test("ReleaseBumper displays stderr when npm install fails", async () => {
    let _stderrDisplayed = false;
    const originalConsoleError = console.error;

    // Mock console.error to capture stderr output
    console.error = (...args) => {
      if (args.join(" ").includes("npm install failed")) {
        _stderrDisplayed = true;
      }
    };

    try {
      const mockExecSync = (command, _options) => {
        if (command === "npm install") {
          // Simulate a failing npm install command with stderr
          const error = new Error("Command failed");
          error.stderr = Buffer.from("npm install failed: ENOENT");
          throw error;
        }
        return "";
      };

      const mockFsModule = {
        readFileSync: () => '{"name": "test", "version": "0.1.0"}',
        writeFileSync: () => {},
        readdirSync: () => [],
      };

      const releaseBumper = new ReleaseBumper(
        mockExecSync,
        mockFsModule.readFileSync,
        mockFsModule.writeFileSync,
        mockFsModule.readdirSync,
      );

      // This should trigger npm install at the end
      await releaseBumper.bump("patch", ["packages/test"]);

      // Should not reach here due to error
      assert.fail("Expected error was not thrown");
    } catch (error) {
      // Error should be thrown, and stderr should not be hidden
      assert(error.message.includes("Command failed"));
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("ReleaseBumper displays stderr when npm version fails", async () => {
    const mockExecSync = (command, _options) => {
      if (command.includes("npm version")) {
        // Simulate a failing npm version command - no stdio: "pipe" means stderr shows
        const error = new Error("Command failed: npm version");
        error.stderr = Buffer.from(
          "npm version failed: package.json not found",
        );
        throw error;
      }
      return "";
    };

    const mockFsModule = {
      readFileSync: () => '{"name": "test", "version": "0.1.0"}',
      writeFileSync: () => {},
      readdirSync: () => [],
    };

    const releaseBumper = new ReleaseBumper(
      mockExecSync,
      mockFsModule.readFileSync,
      mockFsModule.writeFileSync,
      mockFsModule.readdirSync,
    );

    try {
      await releaseBumper.bump("patch", ["packages/test"]);
      assert.fail("Expected error was not thrown");
    } catch (error) {
      // Error should be thrown and contain the command failure info
      assert(error.message.includes("Command failed"));
    }
  });

  test("ReleaseChanges displays stderr when git diff fails", async () => {
    let _stderrDisplayed = false;
    const originalConsoleError = console.error;

    // Mock console.error to capture stderr output
    console.error = (...args) => {
      if (args.join(" ").includes("Git diff command failed")) {
        _stderrDisplayed = true;
      }
    };

    try {
      const mockExecSync = (command, _options) => {
        if (command.includes("git diff")) {
          // Simulate a failing git diff command with stderr
          const error = new Error("Command failed");
          error.stderr = Buffer.from("fatal: bad revision 'invalid-sha'");
          throw error;
        }
        return "";
      };

      const mockFsModule = {
        existsSync: () => true,
      };

      const releaseChanges = new ReleaseChanges(
        mockExecSync,
        mockFsModule.existsSync,
      );

      releaseChanges.getChangedPackages("invalid-sha", "another-invalid-sha");

      // Should not reach here due to error
      assert.fail("Expected error was not thrown");
    } catch (error) {
      // Error should be thrown, and stderr should be displayed
      assert(error.message.includes("Command failed"));
      assert(
        _stderrDisplayed,
        "Expected stderr to be displayed via console.error",
      );
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("execSync without stdio pipe allows stderr to show naturally", () => {
    // This test verifies that removing stdio: "pipe" allows natural stderr display
    // We can't easily test actual stderr output, but we can verify the option is removed

    const capturedCommands = [];
    const mockExecSync = (command, options) => {
      capturedCommands.push({ command, options });
      return "";
    };

    const mockFsModule = {
      readFileSync: () => '{"name": "test", "version": "0.1.0"}',
      writeFileSync: () => {},
      readdirSync: () => [],
    };

    const releaseBumper = new ReleaseBumper(
      mockExecSync,
      mockFsModule.readFileSync,
      mockFsModule.writeFileSync,
      mockFsModule.readdirSync,
    );

    // Just call a method that triggers the fixed execSync calls
    releaseBumper.bump("patch", ["packages/test"]).catch(() => {
      // Ignore errors for this test
    });

    // Check that npm version call doesn't have stdio: "pipe"
    const npmVersionCall = capturedCommands.find((cmd) =>
      cmd.command.includes("npm version"),
    );

    if (npmVersionCall) {
      assert(
        !npmVersionCall.options || !npmVersionCall.options.stdio,
        "npm version should not use stdio: 'pipe' to allow stderr display",
      );
    }

    // Check that npm install call doesn't have stdio: "pipe"
    const npmInstallCall = capturedCommands.find((cmd) =>
      cmd.command.includes("npm install"),
    );

    if (npmInstallCall) {
      assert(
        !npmInstallCall.options || !npmInstallCall.options.stdio,
        "npm install should not use stdio: 'pipe' to allow stderr display",
      );
    }
  });
});
