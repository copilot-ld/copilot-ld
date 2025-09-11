/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

import { common } from "../index.js";

describe("Universal Resource Identifier", () => {
  test("Resource has an identifier", () => {
    const message = common.MessageV2.fromObject({});
    assert.strictEqual(typeof message.id, "object");
  });

  test("withIdentifier throws an error if content is null", () => {
    const message = common.MessageV2.fromObject({
      content: null,
    });
    assert.throws(
      () => {
        message.withIdentifier();
      },
      {
        message: "Resource content must not be null",
      },
    );
  });

  test("withIdentifier generates an identifier", () => {
    const message = common.MessageV2.fromObject({
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.MessageV2");
    assert.strictEqual(message.id.name, "5afdd107");
    assert.strictEqual(message.id.parent, "");
  });

  test("withIdentifier sets a single parent", () => {
    const message = common.MessageV2.fromObject({
      id: {
        parent: "cld:common.Conversation.hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.MessageV2");
    assert.strictEqual(message.id.name, "5afdd107");
    assert.strictEqual(message.id.parent, "cld:common.Conversation.hash0001");
  });

  test("withIdentifier sets multiple parents", () => {
    const message = common.MessageV2.fromObject({
      id: {
        parent: "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.MessageV2");
    assert.strictEqual(message.id.name, "5afdd107");
    assert.strictEqual(
      message.id.parent,
      "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
    );
  });

  test("withIdentifier preserves values", () => {
    const message = common.MessageV2.fromObject({
      id: {
        name: "hash0003",
        parent: "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.MessageV2");
    assert.strictEqual(message.id.name, "hash0003");
    assert.strictEqual(
      message.id.parent,
      "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
    );
  });

  test("Identifier generation throws an error without type", () => {
    const message = common.MessageV2.fromObject({
      id: {},
    });
    assert.throws(
      () => {
        String(message.id);
      },
      {
        message: "Resource type must not be null",
      },
    );
  });

  test("Identifier generation throws an error without name", () => {
    const message = common.MessageV2.fromObject({
      id: { type: "common.MessageV2" },
    });
    assert.throws(
      () => {
        String(message.id);
      },
      {
        message: "Resource name must not be null",
      },
    );
  });

  test("Identifier generates a URI", () => {
    const message = common.MessageV2.fromObject({
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(String(message.id), "cld:common.MessageV2.5afdd107");
  });

  test("Identifier generates a URI with name", () => {
    const message = common.MessageV2.fromObject({
      id: {
        name: "hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(String(message.id), "cld:common.MessageV2.hash0001");
  });

  test("Identifier generates a URI with normalized name", () => {
    const message = common.MessageV2.fromObject({
      id: {
        name: "common.MessageV2.hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(String(message.id), "cld:common.MessageV2.hash0001");
  });

  test("Identifier generates a URI with name and parent", () => {
    const message = common.MessageV2.fromObject({
      id: {
        name: "common.MessageV2.hash0002",
        parent: "cld:common.Conversation.hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(
      String(message.id),
      "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
    );
  });
});
