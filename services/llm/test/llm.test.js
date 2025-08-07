/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { LlmService, LlmServiceInterface } from "../index.js";

describe("llm service", () => {
  describe("LlmService", () => {
    test("exports LlmService class", () => {
      assert.strictEqual(typeof LlmService, "function");
      assert.ok(LlmService.prototype);
    });

    test("exports LlmServiceInterface", () => {
      assert.strictEqual(typeof LlmServiceInterface, "function");
      assert.ok(LlmServiceInterface.prototype);
    });

    test("LlmService has CreateCompletions method", () => {
      assert.strictEqual(
        typeof LlmService.prototype.CreateCompletions,
        "function",
      );
    });

    test("LlmService has CreateEmbeddings method", () => {
      assert.strictEqual(
        typeof LlmService.prototype.CreateEmbeddings,
        "function",
      );
    });

    test("LlmService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(LlmService.length, 2); // config, llmFactory
    });

    test("LlmServiceInterface defines the service contract", () => {
      // Verify the interface exists and can be instantiated
      const interfaceInstance = new LlmServiceInterface();
      assert.ok(interfaceInstance instanceof LlmServiceInterface);
    });

    test("module exports are properly structured", () => {
      assert.ok(LlmService);
      assert.ok(LlmServiceInterface);
      assert.notStrictEqual(LlmService, LlmServiceInterface);
    });

    test("LlmService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(LlmService.prototype);
      assert(methods.includes("CreateCompletions"));
      assert(methods.includes("CreateEmbeddings"));
      assert(methods.includes("constructor"));
    });
  });
});
