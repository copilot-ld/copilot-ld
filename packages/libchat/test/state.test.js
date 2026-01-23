import { describe, test } from "node:test";
import assert from "node:assert";

import { ChatState } from "../state.js";

/**
 * Creates a mock storage (Map-based).
 * @returns {Map} Mock storage
 */
function createMockStorage() {
  return new Map();
}

describe("libchat/state", () => {
  describe("ChatState", () => {
    test("constructor requires storage", () => {
      assert.throws(() => new ChatState(), { message: "storage is required" });
      assert.throws(() => new ChatState(null), {
        message: "storage is required",
      });
    });

    test("constructor accepts Map storage", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      assert.ok(state);
    });

    test("constructor accepts localStorage-like storage", () => {
      const storage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
      const state = new ChatState(storage);
      assert.ok(state);
    });

    test("initializes with null resourceId", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      assert.strictEqual(state.resourceId, null);
    });

    test("initializes with empty messages", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      assert.deepStrictEqual(state.messages, []);
    });

    test("loads existing resourceId from storage", () => {
      const storage = createMockStorage();
      storage.set("chat_resource_id", "existing-id");
      const state = new ChatState(storage);
      assert.strictEqual(state.resourceId, "existing-id");
    });

    test("loads existing messages from storage", () => {
      const storage = createMockStorage();
      const messages = [{ role: "user", content: "Hello" }];
      storage.set("chat_messages", JSON.stringify(messages));
      const state = new ChatState(storage);
      assert.deepStrictEqual(state.messages, messages);
    });
  });

  describe("ChatState.resourceId", () => {
    test("sets and persists resourceId", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);

      state.resourceId = "new-id";

      assert.strictEqual(state.resourceId, "new-id");
      assert.strictEqual(storage.get("chat_resource_id"), "new-id");
    });

    test("clears storage when resourceId set to null", () => {
      const storage = createMockStorage();
      storage.set("chat_resource_id", "old-id");
      storage.set("chat_messages", "[]");
      const state = new ChatState(storage);

      state.resourceId = null;

      assert.strictEqual(state.resourceId, null);
      assert.strictEqual(storage.has("chat_resource_id"), false);
      assert.strictEqual(storage.has("chat_messages"), false);
    });
  });

  describe("ChatState.messages", () => {
    test("returns copy of messages", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";
      state.addMessage({ role: "user", content: "Hello" });

      const messages = state.messages;
      messages.push({ role: "assistant", content: "Modified" });

      assert.strictEqual(state.messages.length, 1);
    });
  });

  describe("ChatState.addMessage", () => {
    test("adds message and persists", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";

      state.addMessage({ role: "user", content: "Hello" });

      assert.strictEqual(state.messages.length, 1);
      assert.strictEqual(state.messages[0].content, "Hello");
    });

    test("adds multiple messages", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";

      state.addMessage({ role: "user", content: "Hello" });
      state.addMessage({ role: "assistant", content: "Hi there!" });

      assert.strictEqual(state.messages.length, 2);
    });
  });

  describe("ChatState.appendToLastMessage", () => {
    test("appends to last message content", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";
      state.addMessage({ role: "assistant", content: "Hello" });

      state.appendToLastMessage(" world!");

      assert.strictEqual(state.messages[0].content, "Hello world!");
    });

    test("does nothing when no messages exist", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";

      state.appendToLastMessage("text");

      assert.strictEqual(state.messages.length, 0);
    });
  });

  describe("ChatState.setMessages", () => {
    test("replaces all messages", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";
      state.addMessage({ role: "user", content: "Old" });

      state.setMessages([
        { role: "user", content: "New 1" },
        { role: "assistant", content: "New 2" },
      ]);

      assert.strictEqual(state.messages.length, 2);
      assert.strictEqual(state.messages[0].content, "New 1");
    });
  });

  describe("ChatState.clear", () => {
    test("clears resourceId and messages", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";
      state.addMessage({ role: "user", content: "Hello" });

      state.clear();

      assert.strictEqual(state.resourceId, null);
      assert.deepStrictEqual(state.messages, []);
    });

    test("clears storage", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";
      state.addMessage({ role: "user", content: "Hello" });

      state.clear();

      assert.strictEqual(storage.has("chat_resource_id"), false);
      assert.strictEqual(storage.has("chat_messages"), false);
    });
  });

  describe("ChatState.onStateChange", () => {
    test("notifies listeners on resourceId change", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      let notified = false;

      state.onStateChange(() => {
        notified = true;
      });

      state.resourceId = "new-id";

      assert.strictEqual(notified, true);
    });

    test("notifies listeners on addMessage", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";
      let notified = false;

      state.onStateChange(() => {
        notified = true;
      });

      state.addMessage({ role: "user", content: "Hello" });

      assert.strictEqual(notified, true);
    });

    test("notifies listeners on clear", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      state.resourceId = "test";
      let notified = false;

      state.onStateChange(() => {
        notified = true;
      });

      state.clear();

      assert.strictEqual(notified, true);
    });

    test("returns unsubscribe function", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      let callCount = 0;

      const unsubscribe = state.onStateChange(() => {
        callCount++;
      });

      state.resourceId = "test1";
      unsubscribe();
      state.resourceId = "test2";

      assert.strictEqual(callCount, 1);
    });

    test("supports multiple listeners", () => {
      const storage = createMockStorage();
      const state = new ChatState(storage);
      let count1 = 0;
      let count2 = 0;

      state.onStateChange(() => count1++);
      state.onStateChange(() => count2++);

      state.resourceId = "test";

      assert.strictEqual(count1, 1);
      assert.strictEqual(count2, 1);
    });
  });
});
