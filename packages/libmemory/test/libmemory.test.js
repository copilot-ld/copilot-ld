import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { MemoryWindow } from "../index.js";
import { MemoryIndex } from "../index/memory.js";
import { resource, common, tool } from "@copilot-ld/libtype";
import { MockStorage, createMockResourceIndex } from "@copilot-ld/libharness";

describe("MemoryWindow", () => {
  let storage;
  let memoryIndex;
  let resourceIndex;
  let memoryWindow;

  beforeEach(() => {
    storage = new MockStorage();
    memoryIndex = new MemoryIndex(storage, "test-conversation.jsonl");
    resourceIndex = createMockResourceIndex({
      tools: ["search", "analyze"],
      temperature: 0.5,
    });
    memoryWindow = new MemoryWindow(
      "test-conversation",
      resourceIndex,
      memoryIndex,
    );
  });

  it("should create instance with required parameters", () => {
    assert.throws(() => new MemoryWindow(), /resourceId is required/);
    assert.throws(() => new MemoryWindow("test"), /resourceIndex is required/);
    assert.throws(
      () => new MemoryWindow("test", resourceIndex),
      /memoryIndex is required/,
    );
  });

  it("should require model parameter", async () => {
    const msg = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 15,
    });

    await memoryIndex.add(msg);

    await assert.rejects(() => memoryWindow.build(), /model is required/);

    await assert.rejects(() => memoryWindow.build(""), /model is required/);
  });

  it("should return messages and tools structure", async () => {
    const msg1 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 15,
    });

    // Add message to resource index so it can be loaded
    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "msg1", tokens: 15 },
        role: "user",
        content: "Hello",
      }),
    );

    await memoryIndex.add(msg1);

    const result = await memoryWindow.build("test-model-1000");

    assert.ok(result.messages, "Should have messages array");
    assert.ok(result.tools, "Should have tools array");
    assert.ok(Array.isArray(result.messages), "messages should be an array");
    assert.ok(Array.isArray(result.tools), "tools should be an array");
  });

  it("should include assistant as first message", async () => {
    const result = await memoryWindow.build("test-model-1000");

    // First message should be the assistant
    assert.ok(result.messages.length >= 1);
    assert.strictEqual(result.messages[0].id?.name, "test-assistant");
  });

  it("should include tools from assistant configuration", async () => {
    const result = await memoryWindow.build("test-model-1000");

    // Should have 2 tools (search and analyze)
    assert.strictEqual(result.tools.length, 2);
    assert.strictEqual(result.tools[0].function?.name, "search");
    assert.strictEqual(result.tools[1].function?.name, "analyze");
  });

  it("should include temperature from assistant configuration", async () => {
    const result = await memoryWindow.build("test-model-1000");

    // Should have temperature from assistant (may be string or number depending on protobuf handling)
    assert.ok(
      result.temperature == 0.5,
      `Expected temperature 0.5, got ${result.temperature}`,
    );
  });

  it("should return all conversation items within budget", async () => {
    const msg1 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 15,
    });
    const msg2 = resource.Identifier.fromObject({
      name: "msg2",
      type: "common.Message",
      tokens: 20,
    });

    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "msg1", tokens: 15 },
        role: "user",
        content: "Hello",
      }),
    );
    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "msg2", tokens: 20 },
        role: "assistant",
        content: "Hi there!",
      }),
    );

    await memoryIndex.add(msg1);
    await memoryIndex.add(msg2);

    const result = await memoryWindow.build("test-model-1000");

    // Should have assistant + 2 conversation messages
    assert.strictEqual(result.messages.length, 3);
    assert.strictEqual(result.messages[0].id?.name, "test-assistant");
    assert.strictEqual(result.messages[1].id?.name, "msg1");
    assert.strictEqual(result.messages[2].id?.name, "msg2");
  });

  it("should build window with budget constraint", async () => {
    const msg1 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 15,
    });
    const msg2 = resource.Identifier.fromObject({
      name: "msg2",
      type: "common.Message",
      tokens: 25,
    });
    const msg3 = resource.Identifier.fromObject({
      name: "msg3",
      type: "common.Message",
      tokens: 10,
    });

    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "msg1", tokens: 15 },
        role: "user",
        content: "First",
      }),
    );
    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "msg2", tokens: 25 },
        role: "assistant",
        content: "Second",
      }),
    );
    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "msg3", tokens: 10 },
        role: "user",
        content: "Third",
      }),
    );

    await memoryIndex.add(msg1);
    await memoryIndex.add(msg2);
    await memoryIndex.add(msg3);

    // Budget of 125: assistant(50) + 2 tools(40) = 90 fixed
    // Remaining 35 for messages, fits msg2(25) + msg3(10) = 35 (from newest first)
    // msg1(15) won't fit
    const result = await memoryWindow.build("test-model-125");

    // Should be assistant + most recent messages that fit
    assert.strictEqual(result.messages.length, 3);
    // Should be in chronological order (oldest first after assistant)
    assert.strictEqual(result.messages[0].id?.name, "test-assistant");
    assert.strictEqual(result.messages[1].id?.name, "msg2");
    assert.strictEqual(result.messages[2].id?.name, "msg3");
  });

  it("should drop orphaned tool messages at start of window", async () => {
    // Simulate a conversation where budget cut leaves tool messages without
    // their preceding assistant message
    const msg1 = resource.Identifier.fromObject({
      name: "assistant-with-tool-calls",
      type: "common.Message",
      tokens: 100,
    });
    const toolResult1 = resource.Identifier.fromObject({
      name: "tool-result-1",
      type: "tool.ToolCallMessage",
      tokens: 50,
    });
    const toolResult2 = resource.Identifier.fromObject({
      name: "tool-result-2",
      type: "tool.ToolCallMessage",
      tokens: 50,
    });
    const msg2 = resource.Identifier.fromObject({
      name: "final-assistant",
      type: "common.Message",
      tokens: 30,
    });

    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "assistant-with-tool-calls", tokens: 100 },
        role: "assistant",
        content: "I'll call tools",
      }),
    );
    resourceIndex.addMessage(
      tool.ToolCallMessage.fromObject({
        id: { name: "tool-result-1", tokens: 50 },
        role: "tool",
        content: "Result 1",
      }),
    );
    resourceIndex.addMessage(
      tool.ToolCallMessage.fromObject({
        id: { name: "tool-result-2", tokens: 50 },
        role: "tool",
        content: "Result 2",
      }),
    );
    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "final-assistant", tokens: 30 },
        role: "assistant",
        content: "Final response",
      }),
    );

    await memoryIndex.add(msg1);
    await memoryIndex.add(toolResult1);
    await memoryIndex.add(toolResult2);
    await memoryIndex.add(msg2);

    // Budget of 230: assistant(50) + 2 tools(40) = 90 fixed
    // Remaining 140 would fit toolResult1(50) + toolResult2(50) + msg2(30) = 130
    // But this leaves orphaned tool messages, so they should be dropped
    const result = await memoryWindow.build("test-model-230");

    // Should only have assistant + final assistant message (tool messages dropped)
    assert.strictEqual(result.messages.length, 2);
    assert.strictEqual(result.messages[0].id?.name, "test-assistant");
    assert.strictEqual(result.messages[1].id?.name, "final-assistant");
  });

  it("should keep tool messages when preceded by assistant message", async () => {
    const msg1 = resource.Identifier.fromObject({
      name: "assistant-with-tool-calls",
      type: "common.Message",
      tokens: 50,
    });
    const toolResult1 = resource.Identifier.fromObject({
      name: "tool-result-1",
      type: "tool.ToolCallMessage",
      tokens: 30,
    });
    const msg2 = resource.Identifier.fromObject({
      name: "final-assistant",
      type: "common.Message",
      tokens: 20,
    });

    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "assistant-with-tool-calls", tokens: 50 },
        role: "assistant",
        content: "Calling tool",
      }),
    );
    resourceIndex.addMessage(
      tool.ToolCallMessage.fromObject({
        id: { name: "tool-result-1", tokens: 30 },
        role: "tool",
        content: "Tool result",
      }),
    );
    resourceIndex.addMessage(
      common.Message.fromObject({
        id: { name: "final-assistant", tokens: 20 },
        role: "assistant",
        content: "Done",
      }),
    );

    await memoryIndex.add(msg1);
    await memoryIndex.add(toolResult1);
    await memoryIndex.add(msg2);

    // Budget of 300 fits everything: assistant(50) + tools(40) = 90
    // Remaining 210 fits all 3 messages (50+30+20=100)
    const result = await memoryWindow.build("test-model-300");

    assert.strictEqual(result.messages.length, 4);
    assert.strictEqual(result.messages[0].id?.name, "test-assistant");
    assert.strictEqual(
      result.messages[1].id?.name,
      "assistant-with-tool-calls",
    );
    assert.strictEqual(result.messages[2].id?.name, "tool-result-1");
    assert.strictEqual(result.messages[3].id?.name, "final-assistant");
  });

  it("should append identifiers through window", async () => {
    const identifiers = [
      resource.Identifier.fromObject({
        name: "msg1",
        type: "common.Message",
        tokens: 10,
      }),
    ];

    await memoryWindow.append(identifiers);

    const fetchedIdentifiers = await memoryIndex.queryItems();
    assert.strictEqual(fetchedIdentifiers.length, 1);
    assert.strictEqual(fetchedIdentifiers[0].name, "msg1");
  });
});
