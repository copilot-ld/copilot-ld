/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { HistoryService, HistoryServiceInterface } from "../index.js";

describe("history service", () => {
  describe("HistoryService", () => {
    test("exports HistoryService class", () => {
      assert.strictEqual(typeof HistoryService, "function");
      assert.ok(HistoryService.prototype);
    });

    test("exports HistoryServiceInterface", () => {
      assert.strictEqual(typeof HistoryServiceInterface, "function");
      assert.ok(HistoryServiceInterface.prototype);
    });

    test("HistoryService has GetHistory method", () => {
      assert.strictEqual(
        typeof HistoryService.prototype.GetHistory,
        "function",
      );
    });

    test("HistoryService has UpdateHistory method", () => {
      assert.strictEqual(
        typeof HistoryService.prototype.UpdateHistory,
        "function",
      );
    });

    test("HistoryService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(HistoryService.length, 5); // config, promptStorage, promptOptimizer, grpcFn, authFn
    });

    test("HistoryServiceInterface defines the service contract", () => {
      // Verify the interface exists and can be instantiated
      const interfaceInstance = new HistoryServiceInterface();
      assert.ok(interfaceInstance instanceof HistoryServiceInterface);
    });

    test("module exports are properly structured", () => {
      assert.ok(HistoryService);
      assert.ok(HistoryServiceInterface);
      assert.notStrictEqual(HistoryService, HistoryServiceInterface);
    });

    test("HistoryService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(HistoryService.prototype);
      assert(methods.includes("GetHistory"));
      assert(methods.includes("UpdateHistory"));
      assert(methods.includes("constructor"));
    });
  });
});
