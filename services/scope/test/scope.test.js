/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { ScopeService, ScopeServiceInterface } from "../index.js";

describe("scope service", () => {
  describe("ScopeService", () => {
    test("exports ScopeService class", () => {
      assert.strictEqual(typeof ScopeService, "function");
      assert.ok(ScopeService.prototype);
    });

    test("exports ScopeServiceInterface", () => {
      assert.strictEqual(typeof ScopeServiceInterface, "function");
      assert.ok(ScopeServiceInterface.prototype);
    });

    test("ScopeService has ResolveScope method", () => {
      assert.strictEqual(
        typeof ScopeService.prototype.ResolveScope,
        "function",
      );
    });

    test("ScopeService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(ScopeService.length, 4); // config, index, grpcFn, authFn
    });

    test("ScopeServiceInterface defines the service contract", () => {
      // Verify the interface exists and can be instantiated
      const interfaceInstance = new ScopeServiceInterface();
      assert.ok(interfaceInstance instanceof ScopeServiceInterface);
    });

    test("module exports are properly structured", () => {
      assert.ok(ScopeService);
      assert.ok(ScopeServiceInterface);
      assert.notStrictEqual(ScopeService, ScopeServiceInterface);
    });

    test("ScopeService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(ScopeService.prototype);
      assert(methods.includes("ResolveScope"));
      assert(methods.includes("constructor"));
    });
  });
});
