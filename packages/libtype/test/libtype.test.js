/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

import { common, history } from "../index.js";

describe("libtype", () => {
  describe("Simple type", () => {
    test("creates type with required properties", () => {
      const similarity = common.Similarity.fromObject({
        id: "test-similarity",
        score: 0.9,
        tokens: 10,
        text: "Test content",
      });

      assert.strictEqual(similarity.id, "test-similarity");
      assert.strictEqual(similarity.score, 0.9);
      assert.strictEqual(similarity.tokens, 10);
      assert.strictEqual(similarity.text, "Test content");
    });

    test("type is of the correct instance", () => {
      const similarity = common.Similarity.fromObject({
        id: "instance-similarity",
        score: 0.9,
        tokens: 1,
        text: "Instance check",
      });

      assert.ok(similarity instanceof common.Similarity);
    });
  });

  describe("Complex type", () => {
    test("creates type with deep properties", () => {
      const request = history.UpdateHistoryRequest.fromObject({
        session_id: "session-1",
        prompt: {
          system_instructions: ["You are an agent"],
          current_similarities: [
            {
              id: "similarity-2",
              score: 0.9,
              tokens: 10,
              text: "Current similarity 2",
            },
          ],
          previous_similarities: [
            {
              id: "similarity-1",
              score: 0.8,
              tokens: 5,
              text: "Previous similarity 1",
            },
          ],
          messages: [
            {
              role: "user",
              content: "What is the capital of France?",
            },
          ],
        },
        github_token: "example-token",
      });

      assert.strictEqual(request.session_id, "session-1");
      assert.strictEqual(request.prompt.system_instructions.length, 1);
      assert.strictEqual(
        request.prompt.system_instructions[0],
        "You are an agent",
      );
      assert.strictEqual(request.prompt.current_similarities.length, 1);
      assert.strictEqual(
        request.prompt.current_similarities[0].id,
        "similarity-2",
      );
      assert.strictEqual(request.prompt.current_similarities[0].score, 0.9);
      assert.strictEqual(request.prompt.current_similarities[0].tokens, 10);
      assert.strictEqual(
        request.prompt.current_similarities[0].text,
        "Current similarity 2",
      );
      assert.strictEqual(request.prompt.previous_similarities.length, 1);
      assert.strictEqual(
        request.prompt.previous_similarities[0].id,
        "similarity-1",
      );
      assert.strictEqual(request.prompt.previous_similarities[0].score, 0.8);
      assert.strictEqual(request.prompt.previous_similarities[0].tokens, 5);
      assert.strictEqual(
        request.prompt.previous_similarities[0].text,
        "Previous similarity 1",
      );
      assert.strictEqual(request.prompt.messages.length, 1);
      assert.strictEqual(request.prompt.messages[0].role, "user");
      assert.strictEqual(
        request.prompt.messages[0].content,
        "What is the capital of France?",
      );
      assert.strictEqual(request.github_token, "example-token");
    });

    test("type is of the correct instance", () => {
      const request = history.UpdateHistoryRequest.fromObject({
        session_id: "session-1",
        prompt: {
          system_instructions: ["You are an agent"],
          current_similarities: [
            {
              id: "similarity-2",
              score: 0.9,
              tokens: 10,
              text: "Current similarity 2",
            },
          ],
          previous_similarities: [
            {
              id: "similarity-1",
              score: 0.8,
              tokens: 5,
              text: "Previous similarity 1",
            },
          ],
          messages: [
            {
              role: "user",
              content: "What is the capital of France?",
            },
          ],
        },
        github_token: "example-token",
      });

      assert.ok(request instanceof history.UpdateHistoryRequest);
      assert.ok(request.prompt instanceof common.Prompt);
      assert.ok(
        request.prompt.current_similarities[0] instanceof common.Similarity,
      );
      assert.ok(
        request.prompt.previous_similarities[0] instanceof common.Similarity,
      );
      assert.ok(request.prompt.messages[0] instanceof common.Message);
    });
  });

  describe("Prompt methods", () => {
    test("toMessages converts prompt to ordered messages array", () => {
      const prompt = new common.Prompt({
        system_instructions: ["You are a helpful assistant", "Be concise"],
        current_similarities: [
          new common.Similarity({ text: "Current context item 1" }),
          new common.Similarity({ text: "Current context item 2" }),
        ],
        previous_similarities: [
          new common.Similarity({ text: "Previous context item 1" }),
        ],
        messages: [
          new common.Message({ role: "user", content: "Hello" }),
          new common.Message({ role: "assistant", content: "Hi there!" }),
        ],
      });

      const messages = prompt.toMessages();

      assert.strictEqual(messages.length, 6);
      assert.strictEqual(messages[0].role, "system");
      assert.strictEqual(messages[0].content, "You are a helpful assistant");
      assert.strictEqual(messages[1].role, "system");
      assert.strictEqual(messages[1].content, "Be concise");
      assert.strictEqual(messages[2].role, "system");
      assert.strictEqual(
        messages[2].content,
        "Current context:\nCurrent context item 1\n\nCurrent context item 2",
      );
      assert.strictEqual(messages[3].role, "system");
      assert.strictEqual(
        messages[3].content,
        "Previous context:\nPrevious context item 1",
      );
      assert.strictEqual(messages[4].role, "user");
      assert.strictEqual(messages[4].content, "Hello");
      assert.strictEqual(messages[5].role, "assistant");
      assert.strictEqual(messages[5].content, "Hi there!");
    });

    test("fromMessages reconstructs prompt from messages array", () => {
      const messages = [
        new common.Message({ role: "system", content: "You are helpful" }),
        new common.Message({ role: "system", content: "Be brief" }),
        new common.Message({
          role: "system",
          content: "Current context:\nContext item 1\n\nContext item 2",
        }),
        new common.Message({
          role: "system",
          content: "Previous context:\nPrevious item 1",
        }),
        new common.Message({ role: "user", content: "Test question" }),
        new common.Message({ role: "assistant", content: "Test response" }),
      ];

      const prompt = new common.Prompt().fromMessages(messages);

      assert.strictEqual(prompt.system_instructions.length, 2);
      assert.strictEqual(prompt.system_instructions[0], "You are helpful");
      assert.strictEqual(prompt.system_instructions[1], "Be brief");
      assert.strictEqual(prompt.current_similarities.length, 2);
      assert.strictEqual(prompt.current_similarities[0].text, "Context item 1");
      assert.strictEqual(prompt.current_similarities[1].text, "Context item 2");
      assert.strictEqual(prompt.previous_similarities.length, 1);
      assert.strictEqual(
        prompt.previous_similarities[0].text,
        "Previous item 1",
      );
      assert.strictEqual(prompt.messages.length, 2);
      assert.strictEqual(prompt.messages[0].role, "user");
      assert.strictEqual(prompt.messages[0].content, "Test question");
      assert.strictEqual(prompt.messages[1].role, "assistant");
      assert.strictEqual(prompt.messages[1].content, "Test response");
    });
  });
});
