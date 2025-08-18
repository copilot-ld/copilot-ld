/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { LlmService } from "../index.js";

describe("llm service", () => {
  describe("LlmService", () => {
    test("exports LlmService class", () => {
      assert.strictEqual(typeof LlmService, "function");
      assert.ok(LlmService.prototype);
    });

    // Interface export tests removed

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
      assert.strictEqual(LlmService.length, 5); // config, llmFactory, grpcFn, authFn, logFn
    });

    // Interface tests removed due to interface deprecation

    test("LlmService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(LlmService.prototype);
      assert(methods.includes("CreateCompletions"));
      assert(methods.includes("CreateEmbeddings"));
      assert(methods.includes("constructor"));
    });
  });
});
