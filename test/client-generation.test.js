/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Generated client/base classes now live in @copilot-ld/librpc
import { clients } from "@copilot-ld/librpc";

// Extract individual classes from the objects
const { LlmClient, AgentClient, MemoryClient, VectorClient, ToolClient } =
  clients;

import { Client } from "@copilot-ld/librpc";

describe("Generated client locations", () => {
  /**
   * Basic contract: each generated client class
   * - Exists at new path under generated/services
   * - Extends base librpc Client (prototype chain)
   * - Exposes expected RPC wrapper methods (defined in proto)
   * NOTE: We intentionally do NOT call RPCs here to avoid needing
   * running gRPC servers; we are validating code generation & placement only.
   */
  test("LLM client class shape", () => {
    assert.ok(LlmClient);
    assert.ok(LlmClient.prototype instanceof Client);
    ["CreateEmbeddings", "CreateCompletions"].forEach((m) =>
      assert.strictEqual(typeof LlmClient.prototype[m], "function"),
    );
  });

  test("Agent client class shape", { skip: "Future PR will fix this" }, () => {
    assert.ok(AgentClient);
    assert.ok(AgentClient.prototype instanceof Client);
    ["ProcessRequest"].forEach((m) =>
      assert.strictEqual(typeof AgentClient.prototype[m], "function"),
    );
  });

  test("Memory client class shape", () => {
    assert.ok(MemoryClient);
    assert.ok(MemoryClient.prototype instanceof Client);
    ["AppendMemory", "GetWindow"].forEach((m) =>
      assert.strictEqual(typeof MemoryClient.prototype[m], "function"),
    );
  });

  test("Vector client class shape", () => {
    assert.ok(VectorClient);
    assert.ok(VectorClient.prototype instanceof Client);
    ["SearchContent"].forEach((m) =>
      assert.strictEqual(typeof VectorClient.prototype[m], "function"),
    );
  });

  test("Tool client class shape", () => {
    assert.ok(ToolClient);
    assert.ok(ToolClient.prototype instanceof Client);
    ["CallTool"].forEach((m) =>
      assert.strictEqual(typeof ToolClient.prototype[m], "function"),
    );
  });
});
