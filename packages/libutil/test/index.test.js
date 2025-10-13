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

  // Implement abstract methods for testing
  async addItem(data, identifier) {
    if (!this.loaded) await this.loadData();

    const item = {
      uri: String(identifier),
      identifier,
      data,
    };

    this.index.set(item.uri, item);
    await this.storage().append(this.indexKey, JSON.stringify(item));
  }

  async queryItems(query, filter = {}) {
    if (!this.loaded) await this.loadData();

    // Simple query implementation for testing - return all items that match the query
    let identifiers = [];
    for (const item of this.index.values()) {
      if (!query || item.data === query) {
        identifiers.push(resource.Identifier.fromObject(item.identifier));
      }
    }

    // Apply shared filters
    const { prefix, limit, max_tokens } = filter;

    if (prefix) {
      identifiers = identifiers.filter((identifier) =>
        this._applyPrefixFilter(String(identifier), prefix),
      );
    }

    let results = this._applyLimitFilter(identifiers, limit);
    results = this._applyTokensFilter(results, max_tokens);

    return results;
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
          uri: "test.Item.item1",
          identifier: { type: "test.Item", name: "item1", tokens: 10 },
          data: "test-data-1",
        },
        {
          uri: "test.Item.item2",
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
        await testIndex.hasItem("test.Item.item1"),
        true,
        "Should load first item",
      );
      assert.strictEqual(
        await testIndex.hasItem("test.Item.item2"),
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
    test("hasItem returns false for non-existent items", async () => {
      const exists = await testIndex.hasItem("test.Item.nonexistent");
      assert.strictEqual(
        exists,
        false,
        "Should return false for non-existent item",
      );
    });

    test("hasItem returns true for existing items", async () => {
      const identifier = resource.Identifier.fromObject({
        type: "test.Item",
        name: "test1",
        tokens: 10,
      });

      await testIndex.addItem("test-data", identifier);
      const exists = await testIndex.hasItem(String(identifier));

      assert.strictEqual(exists, true, "Should return true for existing item");
    });

    test("getItem returns null for non-existent items", async () => {
      const result = await testIndex.getItem("test.Item.nonexistent");
      assert.strictEqual(
        result,
        null,
        "Should return null for non-existent item",
      );
    });

    test("getItem returns identifier for existing items", async () => {
      const identifier = resource.Identifier.fromObject({
        type: "test.Item",
        name: "test1",
        tokens: 10,
      });

      await testIndex.addItem("test-data", identifier);
      const result = await testIndex.getItem(String(identifier));

      assert.strictEqual(
        result.name,
        "test1",
        "Should return correct identifier",
      );
      assert.strictEqual(
        result.type,
        "test.Item",
        "Should return correct type",
      );
      assert.strictEqual(result.tokens, 10, "Should return correct tokens");
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
        await testIndex.addItem(item.data, identifier);
      }
    });

    test("_applyPrefixFilter works correctly", async () => {
      // Test prefix filtering through queryItems
      const allResults = await testIndex.queryItems(null, {});
      const messageResults = await testIndex.queryItems(null, {
        prefix: "common.Message",
      });
      const toolResults = await testIndex.queryItems(null, {
        prefix: "tool.Function",
      });
      const resourceResults = await testIndex.queryItems(null, {
        prefix: "resource.Document",
      });
      const noMatchResults = await testIndex.queryItems(null, {
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
      const unlimitedResults = await testIndex.queryItems(null, {});
      const limitedResults = await testIndex.queryItems(null, { limit: 3 });
      const zeroLimitResults = await testIndex.queryItems(null, { limit: 0 });

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
      const unlimitedResults = await testIndex.queryItems(null, {});
      const tokenLimitedResults = await testIndex.queryItems(null, {
        max_tokens: 35,
      });
      const strictTokenResults = await testIndex.queryItems(null, {
        max_tokens: 20,
      });
      const veryStrictResults = await testIndex.queryItems(null, {
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
      const combinedResults = await testIndex.queryItems(null, {
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

  describe("Abstract Method Enforcement", () => {
    test("IndexBase can be extended and provides base functionality", () => {
      // This test verifies the inheritance pattern works correctly
      class IncompleteIndex extends IndexBase {
        constructor(storage) {
          super(storage);
        }
        // Missing addItem and queryItems implementations
      }

      const incompleteIndex = new IncompleteIndex(mockStorage);

      // The index should be created and inherit base functionality
      assert.ok(incompleteIndex, "Should create instance");
      assert.strictEqual(
        typeof incompleteIndex.hasItem,
        "function",
        "Should inherit hasItem method",
      );
      assert.strictEqual(
        typeof incompleteIndex.getItem,
        "function",
        "Should inherit getItem method",
      );
      assert.strictEqual(
        typeof incompleteIndex.loadData,
        "function",
        "Should inherit loadData method",
      );

      // Abstract methods throw errors when called without implementation
      assert.rejects(
        () => incompleteIndex.addItem("test"),
        /addItem\(\) must be implemented by subclasses/,
        "Should throw error for unimplemented addItem",
      );

      assert.rejects(
        () => incompleteIndex.queryItems("test"),
        /queryItems\(\) must be implemented by subclasses/,
        "Should throw error for unimplemented queryItems",
      );
    });
  });
});
