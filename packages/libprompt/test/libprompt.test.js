/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { PromptBuilder } from "../index.js";

// Test data
import { testMessageData } from "../../../test/shared/mock/data.js";

describe("libprompt", () => {
  describe("PromptBuilder", () => {
    let builder;

    beforeEach(() => {
      builder = new PromptBuilder();
    });

    test("creates empty builder", () => {
      const messages = builder.build();
      assert.strictEqual(messages.length, 0);
    });

    test("adds system prompts", () => {
      builder.system("You are helpful", "Be concise");
      const messages = builder.build();

      assert.strictEqual(messages.length, 2);
      assert.strictEqual(messages[0].role, "system");
      assert.strictEqual(messages[0].content, "You are helpful");
      assert.strictEqual(messages[1].role, "system");
      assert.strictEqual(messages[1].content, "Be concise");
    });

    test("adds context from similarities", () => {
      const similarities = [
        { text: "First context item" },
        { text: "Second context item" },
      ];

      builder.context(similarities);
      const messages = builder.build();

      assert.strictEqual(messages.length, 1);
      assert.strictEqual(messages[0].role, "system");
      assert(messages[0].content.includes("First context item"));
      assert(messages[0].content.includes("Second context item"));
    });

    test("ignores empty context", () => {
      builder.context([]);
      const messages = builder.build();

      assert.strictEqual(messages.length, 0);
    });

    test("adds user messages", () => {
      builder.messages(testMessageData);
      const messages = builder.build();

      assert.strictEqual(messages.length, testMessageData.length);
      assert.strictEqual(messages[0].role, "system");
      assert.strictEqual(messages[1].role, "user");
      assert.strictEqual(messages[2].role, "assistant");
    });

    test("builds messages in correct order", () => {
      const similarities = [{ text: "Context info" }];

      builder
        .system("System prompt")
        .context(similarities)
        .messages([{ role: "user", content: "User message" }]);

      const messages = builder.build();

      assert.strictEqual(messages.length, 3);
      assert.strictEqual(messages[0].role, "system");
      assert.strictEqual(messages[0].content, "System prompt");
      assert.strictEqual(messages[1].role, "system");
      assert(messages[1].content.includes("Context info"));
      assert.strictEqual(messages[2].role, "user");
      assert.strictEqual(messages[2].content, "User message");
    });

    test("supports method chaining", () => {
      const result = builder
        .system("Test")
        .context([{ text: "Context" }])
        .messages([{ role: "user", content: "Hi" }]);

      assert.strictEqual(result, builder);
    });
  });

  describe("PromptBuilder static methods", () => {
    test("generateSessionId creates unique IDs", () => {
      const id1 = PromptBuilder.generateSessionId();
      const id2 = PromptBuilder.generateSessionId();

      assert.notStrictEqual(id1, id2);
      assert(typeof id1 === "string");
      assert(id1.length > 0);
    });

    test("getLatestUserMessage returns latest user message", () => {
      const messages = [
        { role: "system", content: "System" },
        { role: "user", content: "First user" },
        { role: "assistant", content: "Assistant" },
        { role: "user", content: "Latest user" },
      ];

      const latest = PromptBuilder.getLatestUserMessage(messages);

      assert.strictEqual(latest.role, "user");
      assert.strictEqual(latest.content, "Latest user");
    });

    test("getLatestUserMessage returns null when no user messages", () => {
      const messages = [
        { role: "system", content: "System" },
        { role: "assistant", content: "Assistant" },
      ];

      const latest = PromptBuilder.getLatestUserMessage(messages);

      assert.strictEqual(latest, null);
    });

    test("getLatestUserMessage returns null for empty array", () => {
      const latest = PromptBuilder.getLatestUserMessage([]);

      assert.strictEqual(latest, null);
    });
  });
});
