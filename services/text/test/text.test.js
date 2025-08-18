/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { TextService } from "../index.js";

describe("text service", () => {
  describe("TextService", () => {
    test("exports TextService class", () => {
      assert.strictEqual(typeof TextService, "function");
      assert.ok(TextService.prototype);
    });

    test("TextService has GetChunks method", () => {
      assert.strictEqual(typeof TextService.prototype.GetChunks, "function");
    });

    test("TextService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(TextService.length, 5); // config, chunkIndex, grpcFn, authFn, logFn
    });

    // Interface tests removed due to interface deprecation

    test("TextService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(TextService.prototype);
      assert(methods.includes("GetChunks"));
      assert(methods.includes("constructor"));
    });
  });
});
