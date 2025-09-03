/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

import { common } from "../index.js";

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
});
