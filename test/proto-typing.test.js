import { test, describe } from "node:test";
import assert from "node:assert";
import {
  createTypedMessage,
  convertResponseToTyped,
} from "../packages/libservice/index.js";

describe("gRPC Message Type Conversion", () => {
  test("createTypedMessage creates typed message with $typeName", () => {
    const pojo = {
      role: "user",
      content: "Hello world",
    };

    const typedMessage = createTypedMessage(pojo, "common.Message");

    assert.strictEqual(typedMessage.$typeName, "common.Message");
    assert.strictEqual(typedMessage.role, "user");
    assert.strictEqual(typedMessage.content, "Hello world");

    // Verify we can check type using $typeName
    assert.strictEqual(typedMessage.$typeName === "common.Message", true);
  });

  test("convertResponseToTyped handles nested objects", () => {
    const response = {
      id: "test-123",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };

    const typedResponse = convertResponseToTyped(
      response,
      "agent.AgentResponse",
    );

    // Check root object has type
    assert.strictEqual(typedResponse.$typeName, "agent.AgentResponse");

    // Check nested objects have types
    assert.strictEqual(Array.isArray(typedResponse.choices), true);
    if (typedResponse.choices.length > 0) {
      const choice = typedResponse.choices[0];
      assert.strictEqual(choice.$typeName, "common.Choice");

      if (choice.message) {
        assert.strictEqual(choice.message.$typeName, "common.Message");
      }
    }

    if (typedResponse.usage) {
      assert.strictEqual(typedResponse.usage.$typeName, "common.Usage");
    }
  });

  test("typed messages are instanceof Object but have type information", () => {
    const typedMessage = createTypedMessage(
      {
        role: "user",
        content: "test",
      },
      "common.Message",
    );

    // Should still be an object
    assert.strictEqual(typeof typedMessage, "object");
    assert.strictEqual(typedMessage instanceof Object, true);

    // But should have clear type identification
    assert.strictEqual(typedMessage.$typeName, "common.Message");

    // Should be distinguishable from plain objects
    const plainObject = { role: "user", content: "test" };
    assert.strictEqual(plainObject.$typeName, undefined);
    assert.notStrictEqual(typedMessage.$typeName, plainObject.$typeName);
  });

  test("handles non-existing schema gracefully", () => {
    const pojo = { test: "value" };
    const typedMessage = createTypedMessage(pojo, "unknown.Type");

    // Should still add $typeName even if schema not found
    assert.strictEqual(typedMessage.$typeName, "unknown.Type");
    assert.strictEqual(typedMessage.test, "value");
  });
});
