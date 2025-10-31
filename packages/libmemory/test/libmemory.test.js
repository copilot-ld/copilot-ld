/* eslint-env node */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { MemoryFilter, MemoryWindow, MemoryIndex } from "../index.js";
import { resource } from "@copilot-ld/libtype";

// Mock storage for testing
/** Mock storage implementation for testing */
class MockStorage {
  /** Creates a new mock storage instance */
  constructor() {
    this.data = new Map();
  }

  /**
   * Gets data from storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} Stored value
   */
  async get(key) {
    const value = this.data.get(key);
    if (!value) throw new Error("Not found");

    // Simulate JSONL parsing for .jsonl files
    if (key.endsWith(".jsonl")) {
      return value.split("\n").map((line) => JSON.parse(line));
    }
    return value;
  }

  /**
   * Sets data in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  async set(key, value) {
    this.data.set(key, value);
  }

  /**
   * Appends data to storage
   * @param {string} key - Storage key
   * @param {string} value - Value to append
   */
  async append(key, value) {
    const existing = this.data.get(key) || "";
    const newValue = existing ? `${existing}\n${value}` : value;
    this.data.set(key, newValue);
  }

  /**
   * Checks if key exists in storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    return this.data.has(key);
  }

  /**
   * Deletes data from storage
   * @param {string} key - Storage key
   */
  async delete(key) {
    this.data.delete(key);
  }
}

describe("MemoryFilter", () => {
  it("should split tools and history correctly", () => {
    const memory = [
      { name: "tool1", type: "tool.ToolFunction.search", tokens: 10 },
      {
        name: "msg1",
        type: "common.Message",
        parent: "common.Conversation",
        tokens: 15,
      },
      { name: "tool2", type: "tool.ToolFunction.analyze", tokens: 20 },
      {
        name: "msg2",
        type: "common.Message",
        parent: "common.Conversation",
        tokens: 25,
      },
      { name: "context1", type: "resource.Resource", tokens: 30 },
    ];

    const { tools, context, conversation } =
      MemoryFilter.splitResources(memory);

    assert.strictEqual(tools.length, 2);
    assert.strictEqual(conversation.length, 2);
    assert.strictEqual(context.length, 1);
    assert.strictEqual(tools[0].name, "tool1");
    assert.strictEqual(tools[1].name, "tool2");
    assert.strictEqual(conversation[0].name, "msg1");
    assert.strictEqual(conversation[1].name, "msg2");
    assert.strictEqual(context[0].name, "context1");
  });

  it("should handle empty memory array", () => {
    const { tools, context, conversation } = MemoryFilter.splitResources([]);
    assert.deepStrictEqual(tools, []);
    assert.deepStrictEqual(context, []);
    assert.deepStrictEqual(conversation, []);
  });

  it("should handle non-array input", () => {
    const { tools, context, conversation } = MemoryFilter.splitResources(null);
    assert.deepStrictEqual(tools, []);
    assert.deepStrictEqual(context, []);
    assert.deepStrictEqual(conversation, []);
  });

  it("should filter by budget correctly", () => {
    const identifiers = [
      { name: "item1", tokens: 10, score: 0.9 },
      { name: "item2", tokens: 15, score: 0.8 },
      { name: "item3", tokens: 20, score: 0.7 },
      { name: "item4", tokens: 25, score: 0.6 },
    ];

    const filtered = MemoryFilter.filterByBudget(identifiers, 30);

    assert.strictEqual(filtered.length, 2);
    assert.strictEqual(filtered[0].name, "item1"); // Highest score first
    assert.strictEqual(filtered[1].name, "item2");
  });

  it("should return empty array for zero or negative budget", () => {
    const identifiers = [{ name: "item1", tokens: 10 }];

    assert.deepStrictEqual(MemoryFilter.filterByBudget(identifiers, 0), []);
    assert.deepStrictEqual(MemoryFilter.filterByBudget(identifiers, -5), []);
  });

  it("should handle non-array input for budget filter", () => {
    const result = MemoryFilter.filterByBudget(null, 100);
    assert.deepStrictEqual(result, []);
  });

  it("should preserve order when no scores are available", () => {
    const identifiers = [
      { name: "item1", tokens: 10 },
      { name: "item2", tokens: 15 },
      { name: "item3", tokens: 20 },
    ];

    const filtered = MemoryFilter.filterByBudget(identifiers, 30);

    assert.strictEqual(filtered.length, 2);
    assert.strictEqual(filtered[0].name, "item1");
    assert.strictEqual(filtered[1].name, "item2");
  });
});

describe("MemoryWindow", () => {
  let storage;
  let memoryIndex;
  let memoryWindow;

  beforeEach(() => {
    storage = new MockStorage();
    memoryIndex = new MemoryIndex(storage, "test-conversation.jsonl");
    memoryWindow = new MemoryWindow(memoryIndex);
  });

  it("should create instance with required index", () => {
    assert.throws(() => new MemoryWindow(), /index is required/);
  });

  it("should require budget allocation", async () => {
    const identifier1 = resource.Identifier.fromObject({
      name: "tool1",
      type: "tool.ToolFunction.search",
      tokens: 10,
    });
    const identifier2 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 15,
    });

    await memoryIndex.add(identifier1);
    await memoryIndex.add(identifier2);

    await assert.rejects(
      () => memoryWindow.build(),
      /Budget allocation is required: tools, context, conversation/,
    );
  });

  it("should build window with budget allocation", async () => {
    const tool1 = resource.Identifier.fromObject({
      name: "tool1",
      type: "tool.ToolFunction.search",
      tokens: 10,
      score: 0.9,
    });
    const tool2 = resource.Identifier.fromObject({
      name: "tool2",
      type: "tool.ToolFunction.analyze",
      tokens: 20,
      score: 0.8,
    });
    const msg1 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      parent: "common.Conversation",
      tokens: 15,
      score: 0.7,
    });
    const msg2 = resource.Identifier.fromObject({
      name: "msg2",
      type: "common.Message",
      parent: "common.Conversation",
      tokens: 25,
      score: 0.6,
    });

    await memoryIndex.add(tool1);
    await memoryIndex.add(tool2);
    await memoryIndex.add(msg1);
    await memoryIndex.add(msg2);

    const memory = await memoryWindow.build(50, {
      tools: 0.3, // 30% of 50 = 15 tokens
      context: 0.3, // 30% of 50 = 15 tokens
      conversation: 0.4, // 40% of 50 = 20 tokens
    });

    assert.strictEqual(memory.tools.length, 1);
    assert.strictEqual(memory.context.length, 0); // Messages with parent don't count as context
    assert.strictEqual(memory.conversation.length, 1);
    assert.strictEqual(memory.tools[0].name, "tool1"); // Higher score, fits budget
    assert.strictEqual(memory.conversation[0].name, "msg1"); // Higher score, fits budget
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
