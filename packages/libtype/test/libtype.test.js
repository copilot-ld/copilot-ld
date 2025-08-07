/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Module under test
import {
  Chunk,
  Choice,
  Embedding,
  Message,
  Similarity,
  Usage,
} from "../index.js";

describe("libtype", () => {
  describe("Chunk", () => {
    test("creates chunk with required properties", () => {
      const chunk = new Chunk({
        id: "test-chunk",
        text: "Test content",
        tokens: 10,
      });

      assert.strictEqual(chunk.id, "test-chunk");
      assert.strictEqual(chunk.text, "Test content");
      assert.strictEqual(chunk.tokens, 10);
    });

    test("creates chunk with defaults", () => {
      const chunk = new Chunk({ id: "test-chunk" });

      assert.strictEqual(chunk.id, "test-chunk");
      assert.strictEqual(chunk.tokens, 0);
      assert.strictEqual(chunk.text, undefined);
    });

    test("creates chunk without text", () => {
      const chunk = new Chunk({ id: "test-chunk", tokens: 5 });

      assert.strictEqual(chunk.id, "test-chunk");
      assert.strictEqual(chunk.tokens, 5);
      assert.strictEqual(chunk.text, undefined);
    });
  });

  describe("Choice", () => {
    test("creates choice with message object", () => {
      const choice = new Choice({
        index: 0,
        message: { role: "assistant", content: "Hello" },
        finish_reason: "stop",
      });

      assert.strictEqual(choice.index, 0);
      assert.strictEqual(choice.finish_reason, "stop");
      assert(choice.message instanceof Message);
      assert.strictEqual(choice.message.role, "assistant");
      assert.strictEqual(choice.message.content, "Hello");
    });
  });

  describe("Embedding", () => {
    test("creates embedding with vector", () => {
      const embedding = new Embedding({
        index: 0,
        embedding: [0.1, 0.2, 0.3],
      });

      assert.strictEqual(embedding.index, 0);
      assert.deepStrictEqual(embedding.embedding, [0.1, 0.2, 0.3]);
    });
  });

  describe("Message", () => {
    test("creates message with role and content", () => {
      const message = new Message({
        role: "user",
        content: "Hello, world!",
      });

      assert.strictEqual(message.role, "user");
      assert.strictEqual(message.content, "Hello, world!");
    });
  });

  describe("Similarity", () => {
    test("creates similarity with required properties", () => {
      const similarity = new Similarity({
        id: "test-item",
        score: 0.95,
        tokens: 50,
        scope: "test-scope",
      });

      assert.strictEqual(similarity.id, "test-item");
      assert.strictEqual(similarity.score, 0.95);
      assert.strictEqual(similarity.tokens, 50);
      assert.strictEqual(similarity.scope, "test-scope");
    });

    test("creates similarity with defaults", () => {
      const similarity = new Similarity({
        id: "test-item",
        score: 0.95,
      });

      assert.strictEqual(similarity.id, "test-item");
      assert.strictEqual(similarity.score, 0.95);
      assert.strictEqual(similarity.tokens, 0);
      assert.strictEqual(similarity.scope, null);
    });
  });

  describe("Usage", () => {
    test("creates usage with token counts", () => {
      const usage = new Usage({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      });

      assert.strictEqual(usage.prompt_tokens, 10);
      assert.strictEqual(usage.completion_tokens, 20);
      assert.strictEqual(usage.total_tokens, 30);
    });
  });
});
