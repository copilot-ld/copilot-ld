import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import {
  getConversation,
  updateConversation,
  clearConversation,
} from "../state.js";

describe("state", () => {
  beforeEach(() => {
    // Clear any existing conversations between tests
    clearConversation("test-id");
  });

  describe("getConversation", () => {
    test("returns empty state for null id", () => {
      const result = getConversation(null);
      assert.deepStrictEqual(result, { messages: [], metadata: {} });
    });

    test("returns empty state for undefined id", () => {
      const result = getConversation(undefined);
      assert.deepStrictEqual(result, { messages: [], metadata: {} });
    });

    test("creates new conversation for unknown id", () => {
      const result = getConversation("new-id");
      assert.deepStrictEqual(result, { messages: [], metadata: {} });
      clearConversation("new-id");
    });

    test("returns same instance for repeated calls", () => {
      const first = getConversation("test-id");
      const second = getConversation("test-id");
      assert.strictEqual(first, second);
    });
  });

  describe("updateConversation", () => {
    test("does nothing for null id", () => {
      updateConversation(null, [{ role: "user", content: "test" }]);
      const result = getConversation(null);
      assert.deepStrictEqual(result.messages, []);
    });

    test("updates messages for valid id", () => {
      const messages = [{ role: "user", content: "hello" }];
      updateConversation("test-id", messages);
      const result = getConversation("test-id");
      assert.deepStrictEqual(result.messages, messages);
    });
  });

  describe("clearConversation", () => {
    test("does nothing for null id", () => {
      clearConversation(null);
      // Should not throw
    });

    test("removes existing conversation", () => {
      updateConversation("test-id", [{ role: "user", content: "test" }]);
      clearConversation("test-id");
      const result = getConversation("test-id");
      assert.deepStrictEqual(result.messages, []);
    });
  });
});
