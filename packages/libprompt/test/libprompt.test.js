/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import {
  PromptBuilder,
  Prompt,
  PromptAssembler,
  PromptOptimizer,
} from "../index.js";

// Test data
import { testMessageData } from "../../../test/shared/mock/data.js";

describe("libprompt", () => {
  describe("Prompt", () => {
    test("creates empty prompt with defaults", () => {
      const prompt = new Prompt({});

      assert.strictEqual(prompt.system_instructions.length, 0);
      assert.strictEqual(prompt.previous_similarities.length, 0);
      assert.strictEqual(prompt.current_similarities.length, 0);
      assert.strictEqual(prompt.messages.length, 0);
      assert.strictEqual(prompt.isEmpty(), true);
    });

    test("creates prompt with provided data", () => {
      const prompt = new Prompt({
        system_instructions: ["System instruction"],
        previous_similarities: [
          { id: "prev1", score: 0.8, text: "Previous context" },
        ],
        current_similarities: [
          { id: "curr1", score: 0.9, text: "Current context" },
        ],
        messages: [{ role: "user", content: "Hello" }],
      });

      assert.strictEqual(prompt.system_instructions.length, 1);
      assert.strictEqual(prompt.previous_similarities.length, 1);
      assert.strictEqual(prompt.current_similarities.length, 1);
      assert.strictEqual(prompt.messages.length, 1);
      assert.strictEqual(prompt.isEmpty(), false);
    });

    test("isEmpty returns false when has content", () => {
      const promptWithMessages = new Prompt({
        messages: [{ role: "user", content: "Hi" }],
      });
      const promptWithCurrent = new Prompt({
        current_similarities: [{ id: "test", score: 0.5, text: "Context" }],
      });
      const promptWithPrevious = new Prompt({
        previous_similarities: [{ id: "test", score: 0.5, text: "Context" }],
      });

      assert.strictEqual(promptWithMessages.isEmpty(), false);
      assert.strictEqual(promptWithCurrent.isEmpty(), false);
      assert.strictEqual(promptWithPrevious.isEmpty(), false);
    });

    test("toMessages converts prompt to ordered messages", () => {
      const prompt = new Prompt({
        system_instructions: ["You are helpful"],
        previous_similarities: [
          { id: "prev1", score: 0.8, text: "Previous info" },
        ],
        current_similarities: [
          { id: "curr1", score: 0.9, text: "Current info" },
        ],
        messages: [{ role: "user", content: "Hello" }],
      });

      const messages = prompt.toMessages();

      // Should have: system instruction + current context + previous context + user message = 4 messages
      assert.strictEqual(messages.length, 4);
      assert.strictEqual(messages[0].role, "system");
      assert.strictEqual(messages[0].content, "You are helpful");
      assert.strictEqual(messages[1].role, "system");
      assert(messages[1].content.includes("Current context"));
      assert(messages[1].content.includes("Current info"));
      assert.strictEqual(messages[2].role, "system");
      assert(messages[2].content.includes("Previous context"));
      assert(messages[2].content.includes("Previous info"));
      assert.strictEqual(messages[3].role, "user");
      assert.strictEqual(messages[3].content, "Hello");
    });

    test("toMessages handles empty sections", () => {
      const prompt = new Prompt({
        system_instructions: ["System"],
        messages: [{ role: "user", content: "Hi" }],
      });

      const messages = prompt.toMessages();

      assert.strictEqual(messages.length, 2);
      assert.strictEqual(messages[0].content, "System");
      assert.strictEqual(messages[1].content, "Hi");
    });
  });

  describe("PromptAssembler", () => {
    test("buildRequest creates new prompt with combined data", () => {
      const existingPrompt = new Prompt({
        system_instructions: ["Old system"],
        previous_similarities: [{ id: "old", score: 0.7, text: "Old context" }],
        messages: [{ role: "user", content: "Previous question" }],
      });

      const newUserMessage = { role: "user", content: "New question" };
      const current_similarities = [
        { id: "new", score: 0.9, text: "New context" },
      ];
      const system_instructions = ["You are helpful", "Be concise"];

      const result = PromptAssembler.buildRequest(
        existingPrompt,
        newUserMessage,
        current_similarities,
        system_instructions,
      );

      assert.strictEqual(result.system_instructions.length, 2);
      assert.strictEqual(result.system_instructions[0], "You are helpful");
      assert.strictEqual(result.previous_similarities.length, 1);
      assert.strictEqual(result.previous_similarities[0].id, "old");
      assert.strictEqual(result.current_similarities.length, 1);
      assert.strictEqual(result.current_similarities[0].id, "new");
      assert.strictEqual(result.messages.length, 2);
      assert.strictEqual(result.messages[1].content, "New question");
    });

    test("updateWithResponse moves current to previous similarities", () => {
      const prompt = new Prompt({
        system_instructions: ["System"],
        previous_similarities: [{ id: "prev", score: 0.7, text: "Previous" }],
        current_similarities: [{ id: "curr", score: 0.9, text: "Current" }],
        messages: [{ role: "user", content: "Question" }],
      });

      const assistantMessage = { role: "assistant", content: "Answer" };

      const result = PromptAssembler.updateWithResponse(
        prompt,
        assistantMessage,
      );

      assert.strictEqual(result.system_instructions.length, 1);
      assert.strictEqual(result.previous_similarities.length, 2); // prev + curr moved
      assert.strictEqual(result.previous_similarities[0].id, "prev");
      assert.strictEqual(result.previous_similarities[1].id, "curr");
      assert.strictEqual(result.current_similarities.length, 0); // cleared
      assert.strictEqual(result.messages.length, 2);
      assert.strictEqual(result.messages[1].content, "Answer");
    });
  });

  describe("PromptOptimizer", () => {
    test("creates optimizer with default config", () => {
      const mockLlmFactory = () => ({ countTokens: () => 10 });
      const optimizer = new PromptOptimizer(mockLlmFactory);

      assert(optimizer instanceof PromptOptimizer);
    });

    test("creates optimizer with custom config", () => {
      const mockLlmFactory = () => ({ countTokens: () => 10 });
      const config = { totalTokenLimit: 50000 };
      const optimizer = new PromptOptimizer(mockLlmFactory, config);

      assert(optimizer instanceof PromptOptimizer);
    });

    test("optimize returns prompt when within limits", async () => {
      const mockLlm = { countTokens: () => 10 };
      const mockLlmFactory = () => mockLlm;
      const optimizer = new PromptOptimizer(mockLlmFactory, {
        totalTokenLimit: 1000,
      });

      const prompt = new Prompt({
        system_instructions: ["Short instruction"],
        messages: [{ role: "user", content: "Short question" }],
      });

      const result = await optimizer.optimize(prompt, "fake-token");

      // Should return original prompt when within limits
      assert.strictEqual(result.system_instructions.length, 1);
      assert.strictEqual(result.messages.length, 1);
    });
  });

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
