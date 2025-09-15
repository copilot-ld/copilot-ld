/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Generated client/base classes now live exclusively under generated/
import { LlmClient } from "../generated/services/llm/client.js";
import { AgentClient } from "../generated/services/agent/client.js";
import { MemoryClient } from "../generated/services/memory/client.js";
import { VectorClient } from "../generated/services/vector/client.js";
import { ToolClient } from "../generated/services/tool/client.js";
import { HashClient } from "../generated/services/hash/client.js";

import { Client } from "@copilot-ld/librpc";

describe("Generated client locations", () => {
  /**
   * Basic contract: each generated client class
   * - Exists at new path under generated/services
   * - Extends base librpc Client (prototype chain)
   * - Exposes expected RPC wrapper methods (defined in proto)
   * NOTE: We intentionally do NOT call ensureReady()/RPCs here to avoid needing
   * running gRPC servers; we are validating code generation & placement only.
   */
  test("LLM client class shape", () => {
    assert.ok(LlmClient);
    assert.ok(LlmClient.prototype instanceof Client);
    ["CreateEmbeddings", "CreateCompletions"].forEach((m) =>
      assert.strictEqual(typeof LlmClient.prototype[m], "function"),
    );
  });

  test("Agent client class shape", () => {
    assert.ok(AgentClient);
    assert.ok(AgentClient.prototype instanceof Client);
    ["ProcessRequest"].forEach((m) =>
      assert.strictEqual(typeof AgentClient.prototype[m], "function"),
    );
  });

  test("Memory client class shape", () => {
    assert.ok(MemoryClient);
    assert.ok(MemoryClient.prototype instanceof Client);
    ["Append", "GetWindow"].forEach((m) =>
      assert.strictEqual(typeof MemoryClient.prototype[m], "function"),
    );
  });

  test("Vector client class shape", () => {
    assert.ok(VectorClient);
    assert.ok(VectorClient.prototype instanceof Client);
    ["QueryItems", "GetItem"].forEach((m) =>
      assert.strictEqual(typeof VectorClient.prototype[m], "function"),
    );
  });

  test("Tool client class shape", () => {
    assert.ok(ToolClient);
    assert.ok(ToolClient.prototype instanceof Client);
    ["ExecuteTool", "ListTools"].forEach((m) =>
      assert.strictEqual(typeof ToolClient.prototype[m], "function"),
    );
  });

  test("Hash service client class shape", () => {
    assert.ok(HashClient);
    assert.ok(HashClient.prototype instanceof Client);
    ["Sha256", "Md5"].forEach((m) =>
      assert.strictEqual(typeof HashClient.prototype[m], "function"),
    );
  });
});
