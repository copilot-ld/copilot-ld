/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { AgentService } from "../index.js";

describe("agent service", () => {
  describe("AgentService", () => {
    test("exports AgentService class", () => {
      assert.strictEqual(typeof AgentService, "function");
      assert.ok(AgentService.prototype);
    });

    // Interface export tests removed

    test("AgentService has ProcessRequest method", () => {
      assert.strictEqual(
        typeof AgentService.prototype.ProcessRequest,
        "function",
      );
    });

    test("AgentService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(AgentService.length, 6); // config, clients, octokitFactory, grpcFn, authFn, logFn
    });

    // Interface tests removed due to interface deprecation

    test("AgentService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(AgentService.prototype);
      assert(methods.includes("ProcessRequest"));
      assert(methods.includes("constructor"));
    });
  });
});
