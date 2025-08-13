/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import { AgentService, AgentServiceInterface } from "../index.js";

describe("agent service", () => {
  describe("AgentService", () => {
    test("exports AgentService class", () => {
      assert.strictEqual(typeof AgentService, "function");
      assert.ok(AgentService.prototype);
    });

    test("exports AgentServiceInterface", () => {
      assert.strictEqual(typeof AgentServiceInterface, "function");
      assert.ok(AgentServiceInterface.prototype);
    });

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

    test("AgentServiceInterface defines the service contract", () => {
      // Verify the interface exists and can be instantiated
      const interfaceInstance = new AgentServiceInterface();
      assert.ok(interfaceInstance instanceof AgentServiceInterface);
    });

    test("module exports are properly structured", () => {
      assert.ok(AgentService);
      assert.ok(AgentServiceInterface);
      assert.notStrictEqual(AgentService, AgentServiceInterface);
    });

    test("AgentService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(AgentService.prototype);
      assert(methods.includes("ProcessRequest"));
      assert(methods.includes("constructor"));
    });
  });
});
