/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

import { common } from "../index.js";

describe("withMeta extension", () => {
  test("MessageV2 has withMeta method", () => {
    const message = new common.MessageV2();
    assert.strictEqual(typeof message.withMeta, "function");
  });

  test("withMeta generates metadata for MessageV2", () => {
    const message = new common.MessageV2({
      role: "user",
      content: "Hello, world!",
    });

    message.withMeta();
    assert.ok(message.meta);
    assert.strictEqual(message.meta.id, "cld:common.MessageV2.5afdd107");
    assert.strictEqual(message.meta.type, "common.MessageV2");
    assert.ok(typeof message.meta.tokens === "number");
  });

  test("withMeta preserves existing metadata", () => {
    const message = new common.MessageV2.fromObject({
      meta: {
        id: "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        tokens: 100,
      },
      role: "user",
      content: "Hello, world!",
    });

    message.withMeta();
    assert.strictEqual(
      message.meta.id,
      "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
    );
    assert.strictEqual(message.meta.type, "common.MessageV2");
    assert.strictEqual(message.meta.tokens, 100);
  });

  test("withMeta accepts parent parameter", () => {
    const message = new common.MessageV2({
      role: "user",
      content: "Hello, world!",
    });

    message.withMeta("cld:common.Conversation.hash0001");
    assert.ok(message.meta instanceof common.Resource);
    assert.strictEqual(
      message.meta.id,
      "cld:common.Conversation.hash0001/common.MessageV2.5afdd107",
    );
    assert.strictEqual(message.meta.type, "common.MessageV2");
    assert.ok(typeof message.meta.tokens === "number");
  });

  test("withMeta correctly sets parent parameter with existing hash", () => {
    const message = new common.MessageV2.fromObject({
      meta: {
        id: "cld:common.MessageV2.hash0002",
      },
      role: "user",
      content: "Hello, world!",
    });

    message.withMeta("cld:common.Conversation.hash0001");
    assert.ok(message.meta instanceof common.Resource);
    assert.strictEqual(
      message.meta.id,
      "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
    );
  });

  test("withMeta throws error on invalid meta.id format", () => {
    const message = new common.MessageV2.fromObject({
      meta: {
        id: "cld:common.Conversation.hash0001/common.MessageV2",
      },
      role: "user",
      content: "Hello, world!",
    });

    assert.throws(
      () => {
        message.withMeta();
      },
      {
        message: "Invalid meta.id format, missing hash",
      },
    );
  });

  test("withMeta ignores the type property", () => {
    const message = new common.MessageV2.fromObject({
      meta: {
        id: "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        type: "invalid.Type",
      },
      role: "user",
      content: "Hello, world!",
    });

    message.withMeta();
    assert.ok(message.meta instanceof common.Resource);
    assert.strictEqual(message.meta.type, "common.MessageV2");
  });
});

describe("toDescription method", () => {
  test("Resource has toDescription method", () => {
    const resource = new common.Resource();
    assert.strictEqual(typeof resource.toDescription, "function");
  });

  test("toDescription formats resource description", () => {
    const resource = new common.Resource({
      purpose: "Test purpose",
      instructions: "Test instructions",
      applicability: "Test applicability",
      evaluation: "Test evaluation",
    });

    const description = resource.toDescription();

    assert.ok(description.includes("**Purpose:** Test purpose"));
    assert.ok(description.includes("**Instructions:** Test instructions"));
    assert.ok(description.includes("**Applicability:** Test applicability"));
    assert.ok(description.includes("**Evaluation:** Test evaluation"));
  });

  test("toDescription handles missing fields", () => {
    const resource = new common.Resource({
      purpose: "Only purpose set",
    });

    const description = resource.toDescription();

    assert.strictEqual(description, "**Purpose:** Only purpose set");
  });

  test("toDescription returns empty string for empty resource", () => {
    const resource = new common.Resource();
    const description = resource.toDescription();

    assert.strictEqual(description, "");
  });
});
