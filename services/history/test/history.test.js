/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { HistoryService } from "../index.js";

describe("history service", () => {
  describe("HistoryService", () => {
    test("exports HistoryService class", () => {
      assert.strictEqual(typeof HistoryService, "function");
      assert.ok(HistoryService.prototype);
    });

    // Interface export tests removed

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
      assert.strictEqual(HistoryService.length, 6); // config, promptStorage, promptOptimizer, grpcFn, authFn, logFn
    });

    // Interface tests removed due to interface deprecation

    test("HistoryService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(HistoryService.prototype);
      assert(methods.includes("GetHistory"));
      assert(methods.includes("UpdateHistory"));
      assert(methods.includes("constructor"));
    });
  });
});
