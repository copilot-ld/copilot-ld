/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

import { common, resource } from "../index.js";

describe("Universal Resource Identifier", () => {
  test("Resource has an identifier", () => {
    const message = common.Message.fromObject({});
    assert.strictEqual(typeof message.id, "object");
  });

  test("withIdentifier generates UUID when content is null", () => {
    const message = common.Message.fromObject({
      content: null,
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.Message");
    // Should generate a UUID when content is null
    assert.ok(
      message.id.name.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ),
    );
    assert.strictEqual(message.id.parent, "");
  });

  test("withIdentifier generates an identifier", () => {
    const message = common.Message.fromObject({
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.Message");
    assert.strictEqual(message.id.name, "499e2b89");
    assert.strictEqual(message.id.parent, "");
  });

  test("withIdentifier sets a single parent", () => {
    const message = common.Message.fromObject({
      id: {
        parent: "common.Conversation.hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.Message");
    assert.strictEqual(message.id.name, "499e2b89");
    assert.strictEqual(message.id.parent, "common.Conversation.hash0001");
  });

  test("withIdentifier sets multiple parents", () => {
    const message = common.Message.fromObject({
      id: {
        parent: "common.Conversation.hash0001/common.Message.hash0002",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.Message");
    assert.strictEqual(message.id.name, "499e2b89");
    assert.strictEqual(
      message.id.parent,
      "common.Conversation.hash0001/common.Message.hash0002",
    );
  });

  test("withIdentifier preserves values", () => {
    const message = common.Message.fromObject({
      id: {
        name: "hash0003",
        parent: "common.Conversation.hash0001/common.Message.hash0002",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();

    assert.strictEqual(typeof message.id, "object");
    assert.strictEqual(message.id.type, "common.Message");
    assert.strictEqual(message.id.name, "hash0003");
    assert.strictEqual(
      message.id.parent,
      "common.Conversation.hash0001/common.Message.hash0002",
    );
  });

  test("Identifier generation throws an error without type", () => {
    const id = new resource.Identifier();
    assert.throws(
      () => {
        String(id);
      },
      {
        message:
          "resource.Identifier.toString: Resource type must not be null: {}",
      },
    );
  });

  test("Identifier generation throws an error without name", () => {
    const id = new resource.Identifier({ type: "common.Message" });
    assert.throws(
      () => {
        String(id);
      },
      {
        message: "resource.Identifier.toString: Resource name must not be null",
      },
    );
  });

  test("Identifier generates a URI", () => {
    const message = common.Message.fromObject({
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(String(message.id), "common.Message.499e2b89");
  });

  test("Identifier generates a URI with name", () => {
    const message = common.Message.fromObject({
      id: {
        name: "hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(String(message.id), "common.Message.hash0001");
  });

  test("Identifier generates a URI with normalized name", () => {
    const message = common.Message.fromObject({
      id: {
        name: "common.Message.hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(String(message.id), "common.Message.hash0001");
  });

  test("Identifier generates a URI with name and parent", () => {
    const message = common.Message.fromObject({
      id: {
        name: "common.Message.hash0002",
        parent: "common.Conversation.hash0001",
      },
      content: {
        text: "Hello, world!",
      },
    });
    message.withIdentifier();
    assert.strictEqual(
      String(message.id),
      "common.Conversation.hash0001/common.Message.hash0002",
    );
  });
});
