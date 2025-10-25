/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { IndexBase } from "../index.js";
import { resource } from "@copilot-ld/libtype";

/**
 * Test implementation of IndexBase for testing shared functionality
 */
class TestIndex extends IndexBase {
  constructor(storage, indexKey = "test.jsonl") {
    super(storage, indexKey);
  }

  // Override add to test inheritance of base functionality
  async add(identifier, data) {
    const item = {
      id: String(identifier),
      identifier,
      data,
    };

    // Use parent class for generic index operations
    await super.add(item);
  }
}

describe("IndexBase - Shared Functionality", () => {
  let testIndex;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      exists: mock.fn(() => Promise.resolve(false)),
      get: mock.fn(() => Promise.resolve([])),
      append: mock.fn(() => Promise.resolve()),
    };

    testIndex = new TestIndex(mockStorage);
  });

  describe("Constructor and Properties", () => {
    test("constructor validates storage parameter", () => {
      assert.throws(
        () => new TestIndex(null),
        /storage is required/,
        "Should throw for missing storage",
      );
    });

    test("constructor sets properties correctly", () => {
      const index = new TestIndex(mockStorage, "custom.jsonl");
      assert.strictEqual(index.storage(), mockStorage, "Should set storage");
      assert.strictEqual(index.indexKey, "custom.jsonl", "Should set indexKey");
      assert.strictEqual(
        index.loaded,
        false,
        "Should initialize loaded as false",
      );
    });

    test("constructor uses default indexKey when not provided", () => {
      const index = new TestIndex(mockStorage);
      assert.strictEqual(
        index.indexKey,
        "test.jsonl",
        "Should use default indexKey",
      );
    });
  });

  describe("Data Loading", () => {
    test("loadData initializes empty index when file doesn't exist", async () => {
      mockStorage.exists = mock.fn(() => Promise.resolve(false));

      await testIndex.loadData();

      assert.strictEqual(testIndex.loaded, true, "Should mark as loaded");
      assert.strictEqual(
        mockStorage.exists.mock.callCount(),
        1,
        "Should check file existence",
      );
      assert.strictEqual(
        mockStorage.get.mock.callCount(),
        0,
        "Should not try to read non-existent file",
      );
    });

    test("loadData loads existing data from storage", async () => {
      const testData = [
        {
          id: "test.Item.item1",
          identifier: { type: "test.Item", name: "item1", tokens: 10 },
          data: "test-data-1",
        },
        {
          id: "test.Item.item2",
          identifier: { type: "test.Item", name: "item2", tokens: 20 },
          data: "test-data-2",
        },
      ];

      mockStorage.exists = mock.fn(() => Promise.resolve(true));
      mockStorage.get = mock.fn(() => Promise.resolve(testData));

      await testIndex.loadData();

      assert.strictEqual(testIndex.loaded, true, "Should mark as loaded");
      assert.strictEqual(
        mockStorage.exists.mock.callCount(),
        1,
        "Should check file existence",
      );
      assert.strictEqual(
        mockStorage.get.mock.callCount(),
        1,
        "Should read existing file",
      );

      // Verify data was loaded into index
      assert.strictEqual(
        await testIndex.has("test.Item.item1"),
        true,
        "Should load first item",
      );
      assert.strictEqual(
        await testIndex.has("test.Item.item2"),
        true,
        "Should load second item",
      );
    });

    test("loadData is idempotent", async () => {
      mockStorage.exists = mock.fn(() => Promise.resolve(false));

      await testIndex.loadData();
      // Reset mock to verify it's not called again
      mockStorage.exists.mock.resetCalls();

      await testIndex.loadData();

      assert.strictEqual(
        mockStorage.exists.mock.callCount(),
        0,
        "Should not check existence again when already loaded",
      );
      assert.strictEqual(testIndex.loaded, true, "Should remain loaded");
    });
  });

  describe("Item Management", () => {
    test("has returns false for non-existent items", async () => {
      const exists = await testIndex.has("test.Item.nonexistent");
      assert.strictEqual(
        exists,
        false,
        "Should return false for non-existent item",
      );
    });

    test("has returns true for existing items", async () => {
      const identifier = resource.Identifier.fromObject({
        type: "test.Item",
        name: "test1",
        tokens: 10,
      });

      await testIndex.add(identifier, "test-data");
      const exists = await testIndex.has(String(identifier));

      assert.strictEqual(exists, true, "Should return true for existing item");
    });

    test("get returns empty array for non-existent items", async () => {
      const result = await testIndex.get(["test.Item.nonexistent"]);
      assert.strictEqual(
        result.length,
        0,
        "Should return empty array for non-existent item",
      );
    });

    test("get returns identifier for existing items", async () => {
      const identifier = resource.Identifier.fromObject({
        type: "test.Item",
        name: "test1",
        tokens: 10,
      });

      await testIndex.add(identifier, "test-data");
      const result = await testIndex.get([String(identifier)]);

      assert.strictEqual(result.length, 1, "Should return one item");
      assert.strictEqual(
        result[0].name,
        "test1",
        "Should return correct identifier",
      );
      assert.strictEqual(
        result[0].type,
        "test.Item",
        "Should return correct type",
      );
      assert.strictEqual(result[0].tokens, 10, "Should return correct tokens");
    });
  });

  describe("Shared Filter Logic", () => {
    beforeEach(async () => {
      // Add test items with different prefixes and token counts
      const items = [
        { type: "common.Message", name: "msg1", tokens: 10, data: "message-1" },
        { type: "common.Message", name: "msg2", tokens: 20, data: "message-2" },
        {
          type: "tool.Function",
          name: "func1",
          tokens: 15,
          data: "function-1",
        },
        {
          type: "tool.Function",
          name: "func2",
          tokens: 25,
          data: "function-2",
        },
        {
          type: "resource.Document",
          name: "doc1",
          tokens: 30,
          data: "document-1",
        },
      ];

      for (const item of items) {
        const identifier = resource.Identifier.fromObject(item);
        await testIndex.add(identifier, item.data);
      }
    });

    test("_applyPrefixFilter works correctly", async () => {
      // Test prefix filtering through queryItems
      const allResults = await testIndex.queryItems({});
      const messageResults = await testIndex.queryItems({
        prefix: "common.Message",
      });
      const toolResults = await testIndex.queryItems({
        prefix: "tool.Function",
      });
      const resourceResults = await testIndex.queryItems({
        prefix: "resource.Document",
      });
      const noMatchResults = await testIndex.queryItems({
        prefix: "nonexistent",
      });

      assert.strictEqual(
        allResults.length,
        5,
        "Should return all items without prefix filter",
      );
      assert.strictEqual(
        messageResults.length,
        2,
        "Should return only Message items",
      );
      assert.strictEqual(
        toolResults.length,
        2,
        "Should return only Function items",
      );
      assert.strictEqual(
        resourceResults.length,
        1,
        "Should return only Document items",
      );
      assert.strictEqual(
        noMatchResults.length,
        0,
        "Should return no items for non-matching prefix",
      );
    });

    test("_applyLimitFilter works correctly", async () => {
      const unlimitedResults = await testIndex.queryItems({});
      const limitedResults = await testIndex.queryItems({ limit: 3 });
      const zeroLimitResults = await testIndex.queryItems({ limit: 0 });

      assert.strictEqual(
        unlimitedResults.length,
        5,
        "Should return all items without limit",
      );
      assert.strictEqual(
        limitedResults.length,
        3,
        "Should return limited items",
      );
      assert.strictEqual(
        zeroLimitResults.length,
        5,
        "Should return all items when limit is 0",
      );
    });

    test("_applyTokensFilter works correctly", async () => {
      const unlimitedResults = await testIndex.queryItems({});
      const tokenLimitedResults = await testIndex.queryItems({
        max_tokens: 35,
      });
      const strictTokenResults = await testIndex.queryItems({
        max_tokens: 20,
      });
      const veryStrictResults = await testIndex.queryItems({
        max_tokens: 5,
      });

      assert.strictEqual(
        unlimitedResults.length,
        5,
        "Should return all items without token limit",
      );
      // Token filter should accumulate tokens and stop when limit would be exceeded
      assert(
        tokenLimitedResults.length >= 1,
        "Should return at least one item within token limit",
      );
      assert(
        tokenLimitedResults.length <= 5,
        "Should not return more than available items",
      );
      assert.strictEqual(
        strictTokenResults.length,
        1,
        "Should return only first item for strict limit",
      );
      assert.strictEqual(
        veryStrictResults.length,
        0,
        "Should return no items when first exceeds limit",
      );
    });

    test("combined filters work correctly", async () => {
      const combinedResults = await testIndex.queryItems({
        prefix: "common.Message",
        limit: 1,
        max_tokens: 50,
      });

      assert.strictEqual(
        combinedResults.length,
        1,
        "Should apply all filters together",
      );
      assert(
        String(combinedResults[0]).startsWith("common.Message"),
        "Should match prefix filter",
      );
    });
  });

  describe("New IndexBase Implementation", () => {
    test("add uses parent class storage logic", async () => {
      const identifier = resource.Identifier.fromObject({
        type: "test.Item",
        name: "test1",
        tokens: 10,
      });

      await testIndex.add(identifier, "test-data");

      // Verify storage methods were called
      assert.strictEqual(
        mockStorage.append.mock.callCount(),
        1,
        "Should call storage append",
      );

      // Verify item was stored in memory
      assert.strictEqual(
        await testIndex.has(String(identifier)),
        true,
        "Should store item in memory index",
      );
    });

    test("queryItems provides default filtering implementation", async () => {
      // Add test items
      const items = [
        { type: "common.Message", name: "msg1", tokens: 10 },
        { type: "common.Message", name: "msg2", tokens: 20 },
        { type: "tool.Function", name: "func1", tokens: 15 },
      ];

      for (const item of items) {
        const identifier = resource.Identifier.fromObject(item);
        await testIndex.add(identifier, `data-${item.name}`);
      }

      // Test basic query
      const allResults = await testIndex.queryItems({});
      assert.strictEqual(
        allResults.length,
        3,
        "Should return all items with empty filter",
      );

      // Test prefix filter
      const messageResults = await testIndex.queryItems({
        prefix: "common.Message",
      });
      assert.strictEqual(messageResults.length, 2, "Should filter by prefix");

      // Test limit filter
      const limitedResults = await testIndex.queryItems({ limit: 2 });
      assert.strictEqual(limitedResults.length, 2, "Should limit results");

      // Test token filter
      const tokenResults = await testIndex.queryItems({ max_tokens: 25 });
      assert(tokenResults.length <= 3, "Should apply token filter");
    });
  });

  describe("Abstract Method Enforcement", () => {
    test("IndexBase provides concrete implementations", () => {
      // IndexBase now provides concrete add and queryItems
      const index = new IndexBase(mockStorage);

      assert.strictEqual(
        typeof index.add,
        "function",
        "Should provide add method",
      );
      assert.strictEqual(
        typeof index.queryItems,
        "function",
        "Should provide queryItems method",
      );
    });

    test("IndexBase add handles basic storage operations", async () => {
      const index = new IndexBase(mockStorage);
      const item = {
        id: "test.Item.basic",
        identifier: { type: "test.Item", name: "basic", tokens: 5 },
        data: "basic-data",
      };

      await index.add(item);

      assert.strictEqual(
        mockStorage.append.mock.callCount(),
        1,
        "Should call storage append",
      );
      assert.strictEqual(
        await index.has("test.Item.basic"),
        true,
        "Should store item in index",
      );
    });
  });
});
