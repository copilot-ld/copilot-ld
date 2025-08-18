/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import {
  PromptAssembler,
  PromptOptimizer,
  generateSessionId,
  getLatestUserMessage,
} from "../index.js";
import { common } from "@copilot-ld/libtype";

describe("libprompt", () => {
  describe("Prompt", () => {
    test("creates empty prompt with defaults", () => {
      const p = new common.Prompt({});
      assert.strictEqual(p.system_instructions.length, 0);
      assert.strictEqual(p.previous_similarities.length, 0);
      assert.strictEqual(p.current_similarities.length, 0);
      assert.strictEqual(p.messages.length, 0);
      assert.strictEqual(p.isEmpty(), true);
    });

    test("creates prompt with provided data", () => {
      const p = new common.Prompt({
        system_instructions: ["System instruction"],
        previous_similarities: [
          { id: "prev1", score: 0.8, text: "Previous context" },
        ],
        current_similarities: [
          { id: "curr1", score: 0.9, text: "Current context" },
        ],
        messages: [{ role: "user", content: "Hello" }],
      });

      assert.strictEqual(p.system_instructions.length, 1);
      assert.strictEqual(p.previous_similarities.length, 1);
      assert.strictEqual(p.current_similarities.length, 1);
      assert.strictEqual(p.messages.length, 1);
      assert.strictEqual(p.isEmpty(), false);
    });

    test("isEmpty returns false when has content", () => {
      const promptWithMessages = new common.Prompt({
        messages: [{ role: "user", content: "Hi" }],
      });
      const promptWithCurrent = new common.Prompt({
        current_similarities: [{ id: "test", score: 0.5, text: "Context" }],
      });
      const promptWithPrevious = new common.Prompt({
        previous_similarities: [{ id: "test", score: 0.5, text: "Context" }],
      });

      assert.strictEqual(promptWithMessages.isEmpty(), false);
      assert.strictEqual(promptWithCurrent.isEmpty(), false);
      assert.strictEqual(promptWithPrevious.isEmpty(), false);
    });

    test("messages property contains properly structured messages", () => {
      const prompt = new common.Prompt({
        system_instructions: ["You are helpful"],
        previous_similarities: [
          { id: "prev1", score: 0.8, text: "Previous info" },
        ],
        current_similarities: [
          { id: "curr1", score: 0.9, text: "Current info" },
        ],
        messages: [{ role: "user", content: "Hello" }],
      });

      const messages = prompt.messages;

      // The messages property should contain the actual conversation messages
      assert.strictEqual(messages.length, 1);
      assert.strictEqual(messages[0].role, "user");
      assert.strictEqual(messages[0].content, "Hello");
    });

    test("messages property handles different sections properly", () => {
      const prompt = new common.Prompt({
        system_instructions: ["System"],
        messages: [{ role: "user", content: "Hi" }],
      });

      const messages = prompt.messages;

      assert.strictEqual(messages.length, 1);
      assert.strictEqual(messages[0].content, "Hi");
    });
  });

  describe("PromptAssembler", () => {
    test("buildRequest creates new prompt with combined data", () => {
      const existingPrompt = new common.Prompt({
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
      const prompt = new common.Prompt({
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

      const prompt = new common.Prompt({
        system_instructions: ["Short instruction"],
        messages: [{ role: "user", content: "Short question" }],
      });

      const result = await optimizer.optimize(prompt, "fake-token");

      // Should return original prompt when within limits
      assert.strictEqual(result.system_instructions.length, 1);
      assert.strictEqual(result.messages.length, 1);
    });
  });

  describe("Utility functions", () => {
    test("generateSessionId creates unique IDs", () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

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

      const latest = getLatestUserMessage(messages);

      assert.strictEqual(latest.role, "user");
      assert.strictEqual(latest.content, "Latest user");
    });

    test("getLatestUserMessage returns null when no user messages", () => {
      const messages = [
        { role: "system", content: "System" },
        { role: "assistant", content: "Assistant" },
      ];

      const latest = getLatestUserMessage(messages);

      assert.strictEqual(latest, null);
    });

    test("getLatestUserMessage returns null for empty array", () => {
      const latest = getLatestUserMessage([]);

      assert.strictEqual(latest, null);
    });
  });
});
