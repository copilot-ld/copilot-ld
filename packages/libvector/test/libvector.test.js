/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { VectorIndex } from "../index.js";
import { resource } from "@copilot-ld/libtype";

describe("libvector", () => {
  describe("VectorIndex", () => {
    let vectorIndex;
    let mockStorage;

    beforeEach(() => {
      mockStorage = {
        exists: mock.fn(() => Promise.resolve(true)),
        get: mock.fn(() => Promise.resolve(Buffer.from(""))),
        put: mock.fn(() => Promise.resolve()),
        append: mock.fn(() => Promise.resolve()),
      };

      vectorIndex = new VectorIndex(mockStorage);
    });

    test("storage returns storage instance", () => {
      assert.strictEqual(vectorIndex.storage(), mockStorage);
    });

    test("addItem adds new vector", async () => {
      const identifier = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
        tokens: 10,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier);

      // Verify item was added by checking internal state
      assert(await vectorIndex.hasItem("test-1"));
    });

    test("addItem appends JSON-ND format with newline", async () => {
      const identifier = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
        tokens: 10,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier);

      // Verify append was called with JSON-ND format including newline
      assert.strictEqual(mockStorage.append.mock.callCount(), 1);
      const appendCall = mockStorage.append.mock.calls[0].arguments;
      assert.strictEqual(appendCall[0], "index.jsonl"); // key

      const appendedData = appendCall[1];
      // Should be JSON followed by newline
      assert(
        appendedData.endsWith("\n"),
        "Appended data should end with newline",
      );

      // Should be valid JSON before the newline
      const jsonData = appendedData.slice(0, -1);
      assert.doesNotThrow(() => JSON.parse(jsonData), "Should be valid JSON");

      const parsedData = JSON.parse(jsonData);

      // Check that the structure is correct
      assert(parsedData.uri, "Should have uri property");
      assert(parsedData.identifier, "Should have identifier property");
      assert(parsedData.vector, "Should have vector property");
      assert.strictEqual(parsedData.uri, "cld:MessageV2.test-1");
      assert.deepStrictEqual(parsedData.vector, [0.1, 0.2, 0.3]);
    });

    test("addItem updates existing vector", async () => {
      const identifier1 = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
        tokens: 10,
      });
      const identifier2 = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
        tokens: 20,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier1);
      await vectorIndex.addItem([0.4, 0.5, 0.6], identifier2);

      assert(await vectorIndex.hasItem("test-1"));
    });

    test("hasItem returns true for existing item", async () => {
      const identifier = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier);

      const exists = await vectorIndex.hasItem("test-1");

      assert.strictEqual(exists, true);
    });

    test("hasItem returns false for non-existing item", async () => {
      const exists = await vectorIndex.hasItem("non-existent");

      assert.strictEqual(exists, false);
    });

    test("loadData loads from storage", async () => {
      const testData = [
        {
          id: "test-1",
          vector: [0.1, 0.2, 0.3],
          magnitude: 0.374,
          tokens: 10,
        },
      ];

      mockStorage.get = mock.fn(() =>
        Promise.resolve(Buffer.from(JSON.stringify(testData))),
      );

      await vectorIndex.loadData();

      assert.strictEqual(mockStorage.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockStorage.get.mock.calls[0].arguments, [
        "index.jsonl",
      ]);
    });

    test("loadData initializes empty index when not found", async () => {
      mockStorage.exists = mock.fn(() => Promise.resolve(false));

      await vectorIndex.loadData();

      // Should not throw and should initialize empty index
      assert.strictEqual(mockStorage.exists.mock.callCount(), 1);
      assert.strictEqual(await vectorIndex.hasItem("any-id"), false);
    });

    test("persist saves to storage", async () => {
      const identifier = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier);
      await vectorIndex.persist();

      assert.strictEqual(mockStorage.put.mock.callCount(), 1);
      assert.strictEqual(
        mockStorage.put.mock.calls[0].arguments[0],
        "index.jsonl",
      );
    });

    test("queryItems returns similar vectors", async () => {
      const identifier1 = new resource.Identifier({
        id: "similar",
        type: "MessageV2",
        name: "MessageV2.similar",
        tokens: 10,
      });
      const identifier2 = new resource.Identifier({
        id: "different",
        type: "MessageV2",
        name: "MessageV2.different",
        tokens: 15,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier1);
      await vectorIndex.addItem([0.9, 0.8, 0.7], identifier2);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0.5,
      });

      // Should return vectors above threshold - both might be above threshold depending on calculation
      assert(results.length >= 1);
      assert(results.some((r) => r.id === "similar"));
      assert(results[0].score > 0.5); // At least above threshold
    });

    test("queryItems respects threshold", async () => {
      const identifier1 = new resource.Identifier({
        id: "item1",
        type: "MessageV2",
        name: "MessageV2.item1",
        tokens: 10,
      });
      const identifier2 = new resource.Identifier({
        id: "item2",
        type: "MessageV2",
        name: "MessageV2.item2",
        tokens: 15,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier1);
      await vectorIndex.addItem([0.9, 0.8, 0.7], identifier2);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0.9,
      });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, "item1");
    });

    test("queryItems respects limit", async () => {
      const identifier1 = new resource.Identifier({
        id: "item1",
        type: "MessageV2",
        name: "MessageV2.item1",
        tokens: 10,
      });
      const identifier2 = new resource.Identifier({
        id: "item2",
        type: "MessageV2",
        name: "MessageV2.item2",
        tokens: 15,
      });
      const identifier3 = new resource.Identifier({
        id: "item3",
        type: "MessageV2",
        name: "MessageV2.item3",
        tokens: 20,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier1);
      await vectorIndex.addItem([0.2, 0.3, 0.4], identifier2);
      await vectorIndex.addItem([0.3, 0.4, 0.5], identifier3);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0,
        limit: 2,
      });

      assert.strictEqual(results.length, 2);
      // Results should be sorted by score descending
      assert(results[0].score >= results[1].score);
    });

    test("queryItems returns empty array for no matches", async () => {
      const identifier = new resource.Identifier({
        id: "item1",
        type: "MessageV2",
        name: "MessageV2.item1",
        tokens: 10,
      });
      await vectorIndex.addItem([0.9, 0.8, 0.7], identifier);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0.9,
      });

      assert.strictEqual(results.length, 0);
    });

    test("queryItems includes identifier in results", async () => {
      const identifier = new resource.Identifier({
        id: "test-id",
        type: "MessageV2",
        name: "MessageV2.test-id",
        tokens: 42,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0,
      });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, "test-id");
      assert.strictEqual(results[0].tokens, 42);
      assert(results[0].score > 0.9);
    });

    test("queryItems respects maxTokens parameter", async () => {
      const identifier1 = new resource.Identifier({
        id: "item1",
        type: "MessageV2",
        name: "MessageV2.item1",
        tokens: 10,
      });
      const identifier2 = new resource.Identifier({
        id: "item2",
        type: "MessageV2",
        name: "MessageV2.item2",
        tokens: 15,
      });
      const identifier3 = new resource.Identifier({
        id: "item3",
        type: "MessageV2",
        name: "MessageV2.item3",
        tokens: 20,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier1);
      await vectorIndex.addItem([0.2, 0.3, 0.4], identifier2);
      await vectorIndex.addItem([0.3, 0.4, 0.5], identifier3);

      // Max 25 tokens should allow first two items (10 + 15 = 25)
      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0,
        limit: 0,
        max_tokens: 25,
      });

      assert.strictEqual(results.length, 2);
      // Verify total tokens don't exceed limit
      const totalTokens = results.reduce((sum, r) => sum + (r.tokens || 0), 0);
      assert(totalTokens <= 25);
    });

    test("queryItems without maxTokens returns all results", async () => {
      const identifier1 = new resource.Identifier({
        id: "item1",
        type: "MessageV2",
        name: "MessageV2.item1",
        tokens: 10,
      });
      const identifier2 = new resource.Identifier({
        id: "item2",
        type: "MessageV2",
        name: "MessageV2.item2",
        tokens: 15,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier1);
      await vectorIndex.addItem([0.2, 0.3, 0.4], identifier2);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0,
      });

      assert.strictEqual(results.length, 2);
    });

    test("queryItems with maxTokens null returns all results", async () => {
      const identifier1 = new resource.Identifier({
        id: "item1",
        type: "MessageV2",
        name: "MessageV2.item1",
        tokens: 10,
      });
      const identifier2 = new resource.Identifier({
        id: "item2",
        type: "MessageV2",
        name: "MessageV2.item2",
        tokens: 15,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier1);
      await vectorIndex.addItem([0.2, 0.3, 0.4], identifier2);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], {
        threshold: 0,
        limit: 0,
        max_tokens: null,
      });

      assert.strictEqual(results.length, 2);
    });
  });
});
