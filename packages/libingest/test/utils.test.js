/* eslint-env node */
// Standard imports - always first
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

// Module under test - second section
import { Utils } from "../utils.js";

// Node.js built-in modules for test setup
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Utils", () => {
  describe("loadPrompt", () => {
    let tempDir;

    beforeEach(() => {
      // Create a temporary directory for test files
      tempDir = join(tmpdir(), `utils-test-${Date.now()}`);
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      // Clean up temporary directory
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test("loads prompt file successfully", () => {
      const promptContent = "This is a test prompt";
      const promptFile = "test-prompt.md";
      const promptPath = join(tempDir, promptFile);

      writeFileSync(promptPath, promptContent, "utf-8");

      const result = Utils.loadPrompt(promptFile, tempDir);
      assert.strictEqual(result, promptContent);
    });

    test("throws error when promptName is empty string", () => {
      assert.throws(() => Utils.loadPrompt(""), {
        name: "Error",
        message: "promptName must be supplied",
      });
    });

    test("throws error when promptName is null", () => {
      assert.throws(() => Utils.loadPrompt(null), {
        name: "Error",
        message: "promptName must be supplied",
      });
    });

    test("throws error when prompt file does not exist", () => {
      const nonExistentFile = "non-existent-prompt.md";
      const expectedPath = join(tempDir, nonExistentFile);

      assert.throws(() => Utils.loadPrompt(nonExistentFile, tempDir), {
        name: "Error",
        message: `Prompt file does not exist: ${expectedPath}`,
      });
    });

    test("handles multi-line prompt content", () => {
      const promptContent = `Line 1
Line 2
Line 3`;
      const promptFile = "multiline-prompt.md";
      const promptPath = join(tempDir, promptFile);

      writeFileSync(promptPath, promptContent, "utf-8");

      const result = Utils.loadPrompt(promptFile, tempDir);
      assert.strictEqual(result, promptContent);
    });

    test("handles prompt files with special characters", () => {
      const promptContent = "Special chars: @#$%^&*()";
      const promptFile = "special-prompt.md";
      const promptPath = join(tempDir, promptFile);

      writeFileSync(promptPath, promptContent, "utf-8");

      const result = Utils.loadPrompt(promptFile, tempDir);
      assert.strictEqual(result, promptContent);
    });
  });

  describe("isPdftoppmAvailable", () => {
    test("returns a boolean value", () => {
      const result = Utils.isPdftoppmAvailable();
      assert.strictEqual(typeof result, "boolean");
    });

    test("does not throw an error when called", () => {
      assert.doesNotThrow(() => {
        Utils.isPdftoppmAvailable();
      });
    });
  });

  describe("getGithubToken", () => {
    let originalToken;

    beforeEach(() => {
      // Save original token
      originalToken = globalThis.process.env.GITHUB_TOKEN;
    });

    afterEach(() => {
      // Restore original token
      if (originalToken !== undefined) {
        globalThis.process.env.GITHUB_TOKEN = originalToken;
      } else {
        delete globalThis.process.env.GITHUB_TOKEN;
      }
    });

    test("returns token when GITHUB_TOKEN is set", () => {
      const testToken = "ghp_test_token_123";
      globalThis.process.env.GITHUB_TOKEN = testToken;

      const result = Utils.getGithubToken();
      assert.strictEqual(result, testToken);
    });

    test("throws error when GITHUB_TOKEN is not set", () => {
      delete globalThis.process.env.GITHUB_TOKEN;

      assert.throws(() => Utils.getGithubToken(), {
        name: "Error",
        message: "GitHub token not found in environment",
      });
    });

    test("throws error when GITHUB_TOKEN is empty string", () => {
      globalThis.process.env.GITHUB_TOKEN = "";

      assert.throws(() => Utils.getGithubToken(), {
        name: "Error",
        message: "GitHub token not found in environment",
      });
    });

    test("handles token with special characters", () => {
      const testToken = "ghp_test-token.with_special/chars";
      globalThis.process.env.GITHUB_TOKEN = testToken;

      const result = Utils.getGithubToken();
      assert.strictEqual(result, testToken);
    });
  });
});
