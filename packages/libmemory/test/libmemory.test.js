/* eslint-env node */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { MemoryIndex, MemoryFilter, MemoryWindow } from "../index.js";
import { resource } from "@copilot-ld/libtype";

// Mock storage for testing
class MockStorage {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    const value = this.data.get(key);
    if (!value) throw new Error("Not found");

    // Simulate JSONL parsing for .jsonl files
    if (key.endsWith(".jsonl")) {
      return value.split("\n").map((line) => JSON.parse(line));
    }
    return value;
  }

  async set(key, value) {
    this.data.set(key, value);
  }

  async append(key, value) {
    const existing = this.data.get(key) || "";
    const newValue = existing ? `${existing}\n${value}` : value;
    this.data.set(key, newValue);
  }

  async exists(key) {
    return this.data.has(key);
  }

  async delete(key) {
    this.data.delete(key);
  }
}

describe("MemoryIndex", () => {
  let storage;
  let memoryIndex;

  beforeEach(() => {
    storage = new MockStorage();
    memoryIndex = new MemoryIndex(storage, "test-conversation.jsonl");
  });

  it("should create instance with required storage", () => {
    assert.throws(() => new MemoryIndex(), /storage is required/);
  });

  it("should add identifiers to memory", async () => {
    const identifier1 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 10,
    });
    const identifier2 = resource.Identifier.fromObject({
      name: "msg2",
      type: "common.Message",
      tokens: 15,
    });

    await memoryIndex.addItem(identifier1);
    await memoryIndex.addItem(identifier2);

    const stored = storage.data.get("test-conversation.jsonl");
    const lines = stored.split("\n");
    assert.strictEqual(lines.length, 2);
    const item1 = JSON.parse(lines[0]);
    const item2 = JSON.parse(lines[1]);

    // Check the identifier properties (not deep equality since they become plain objects after serialization)
    assert.strictEqual(item1.identifier.name, "msg1");
    assert.strictEqual(item1.identifier.type, "common.Message");
    assert.strictEqual(item1.identifier.tokens, 10);
    assert.strictEqual(item2.identifier.name, "msg2");
    assert.strictEqual(item2.identifier.type, "common.Message");
    assert.strictEqual(item2.identifier.tokens, 15);
  });

  it("should handle empty identifiers array", async () => {
    // Test no-op when no identifiers are added
    const result = await memoryIndex.queryItems();
    assert.deepStrictEqual(result, []);
  });

  it("should add identifiers and query them back", async () => {
    const identifier1 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 10,
    });
    const identifier2 = resource.Identifier.fromObject({
      name: "msg2",
      type: "common.Message",
      tokens: 15,
    });
    const identifier3 = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 12,
    }); // duplicate name

    await memoryIndex.addItem(identifier1);
    await memoryIndex.addItem(identifier2);
    await memoryIndex.addItem(identifier3); // This will overwrite the first one

    const memory = await memoryIndex.queryItems();

    // Should only have 2 items after deduplication (same name+type = same identifier)
    assert.strictEqual(memory.length, 2);

    // Find the items by name since order might vary
    const msg1 = memory.find((item) => item.name === "msg1");
    const msg2 = memory.find((item) => item.name === "msg2");

    assert.ok(msg1, "Should have msg1");
    assert.ok(msg2, "Should have msg2");
    assert.strictEqual(msg1.tokens, 12); // Latest occurrence kept
    assert.strictEqual(msg2.tokens, 15);
  });

  it("should return empty array for non-existent memory", async () => {
    const memory = await memoryIndex.queryItems();
    assert.deepStrictEqual(memory, []);
  });

  it("should implement queryItems interface", async () => {
    const identifier = resource.Identifier.fromObject({
      name: "msg1",
      type: "common.Message",
      tokens: 10,
    });

    await memoryIndex.addItem(identifier);
    const result = await memoryIndex.queryItems();

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, "msg1");
    assert.strictEqual(result[0].type, "common.Message");
    assert.strictEqual(result[0].tokens, 10);
  });
});

describe("MemoryFilter", () => {
  it("should split tools and history correctly", () => {
    const memory = [
      { name: "tool1", type: "tool.ToolFunction.search", tokens: 10 },
      { name: "msg1", type: "common.Message", tokens: 15 },
      { name: "tool2", type: "tool.ToolFunction.analyze", tokens: 20 },
      { name: "msg2", type: "common.Message", tokens: 25 },
    ];

    const { tools, history } = MemoryFilter.splitToolsAndHistory(memory);

    assert.strictEqual(tools.length, 2);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(tools[0].name, "tool1");
    assert.strictEqual(tools[1].name, "tool2");
    assert.strictEqual(history[0].name, "msg1");
    assert.strictEqual(history[1].name, "msg2");
  });

  it("should handle empty memory array", () => {
    const { tools, history } = MemoryFilter.splitToolsAndHistory([]);
    assert.deepStrictEqual(tools, []);
    assert.deepStrictEqual(history, []);
  });

  it("should handle non-array input", () => {
    const { tools, history } = MemoryFilter.splitToolsAndHistory(null);
    assert.deepStrictEqual(tools, []);
    assert.deepStrictEqual(history, []);
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

    await memoryIndex.addItem(identifier1);
    await memoryIndex.addItem(identifier2);

    await assert.rejects(
      () => memoryWindow.build(),
      /Budget allocation of tools and history is required/,
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
      tokens: 15,
      score: 0.7,
    });
    const msg2 = resource.Identifier.fromObject({
      name: "msg2",
      type: "common.Message",
      tokens: 25,
      score: 0.6,
    });

    await memoryIndex.addItem(tool1);
    await memoryIndex.addItem(tool2);
    await memoryIndex.addItem(msg1);
    await memoryIndex.addItem(msg2);

    const memory = await memoryWindow.build(50, {
      tools: 0.3, // 30% of 50 = 15 tokens
      history: 0.4, // 40% of 50 = 20 tokens
    });

    assert.strictEqual(memory.tools.length, 1);
    assert.strictEqual(memory.history.length, 1);
    assert.strictEqual(memory.tools[0].name, "tool1"); // Higher score, fits budget
    assert.strictEqual(memory.history[0].name, "msg1"); // Higher score, fits budget
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
