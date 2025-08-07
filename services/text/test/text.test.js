/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { TextService, TextServiceInterface } from "../index.js";

describe("text service", () => {
  describe("TextService", () => {
    test("exports TextService class", () => {
      assert.strictEqual(typeof TextService, "function");
      assert.ok(TextService.prototype);
    });

    test("exports TextServiceInterface", () => {
      assert.strictEqual(typeof TextServiceInterface, "function");
      assert.ok(TextServiceInterface.prototype);
    });

    test("TextService has GetChunks method", () => {
      assert.strictEqual(typeof TextService.prototype.GetChunks, "function");
    });

    test("TextService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(TextService.length, 2); // config, chunkIndex
    });

    test("TextServiceInterface defines the service contract", () => {
      // Verify the interface exists and can be instantiated
      const interfaceInstance = new TextServiceInterface();
      assert.ok(interfaceInstance instanceof TextServiceInterface);
    });

    test("module exports are properly structured", () => {
      assert.ok(TextService);
      assert.ok(TextServiceInterface);
      assert.notStrictEqual(TextService, TextServiceInterface);
    });

    test("TextService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(TextService.prototype);
      assert(methods.includes("GetChunks"));
      assert(methods.includes("constructor"));
    });
  });
});
