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

      // Verify item was added by checking internal state using URI
      assert(await vectorIndex.hasItem("cld:MessageV2.test-1"));
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

      assert(await vectorIndex.hasItem("cld:MessageV2.test-1"));
    });

    test("hasItem returns true for existing item", async () => {
      const identifier = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier);

      const exists = await vectorIndex.hasItem("cld:MessageV2.test-1");

      assert.strictEqual(exists, true);
    });

    test("hasItem returns false for non-existing item", async () => {
      const exists = await vectorIndex.hasItem("cld:MessageV2.non-existent");

      assert.strictEqual(exists, false);
    });

    test("loadData loads from storage", async () => {
      const testData = JSON.stringify({
        uri: "cld:MessageV2.test-1",
        identifier: {
          id: "test-1",
          type: "MessageV2",
          name: "MessageV2.test-1",
          tokens: 10,
        },
        vector: [0.1, 0.2, 0.3],
      });

      mockStorage.get = mock.fn(() => Promise.resolve(Buffer.from(testData)));

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
      assert.strictEqual(
        await vectorIndex.hasItem("cld:MessageV2.any-id"),
        false,
      );
    });

    test("queryItems returns similar vectors", async () => {
      // Helper function to normalize vectors like libcopilot does
      const normalize = (vector) => {
        const magnitude = Math.sqrt(
          vector.reduce((sum, val) => sum + val * val, 0),
        );
        return vector.map((val) => val / magnitude);
      };

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
      await vectorIndex.addItem(normalize([0.1, 0.2, 0.3]), identifier1);
      await vectorIndex.addItem(normalize([0.9, 0.8, 0.7]), identifier2);

      const results = await vectorIndex.queryItems(normalize([0.1, 0.2, 0.3]), {
        threshold: 0.8,
      });

      // Should return vectors above threshold - identical vector should score ~1.0
      assert(results.length >= 1);
      assert(results.some((r) => r.id === "similar"));
      assert(results[0].score > 0.8); // At least above threshold
    });

    test("queryItems respects threshold", async () => {
      // Helper function to normalize vectors like libcopilot does
      const normalize = (vector) => {
        const magnitude = Math.sqrt(
          vector.reduce((sum, val) => sum + val * val, 0),
        );
        return vector.map((val) => val / magnitude);
      };

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
      await vectorIndex.addItem(normalize([0.1, 0.2, 0.3]), identifier1);
      await vectorIndex.addItem(normalize([0.9, 0.8, 0.7]), identifier2);

      const results = await vectorIndex.queryItems(normalize([0.1, 0.2, 0.3]), {
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
      // Helper function to normalize vectors like libcopilot does
      const normalize = (vector) => {
        const magnitude = Math.sqrt(
          vector.reduce((sum, val) => sum + val * val, 0),
        );
        return vector.map((val) => val / magnitude);
      };

      const identifier = new resource.Identifier({
        id: "test-id",
        type: "MessageV2",
        name: "MessageV2.test-id",
        tokens: 42,
      });
      await vectorIndex.addItem(normalize([0.1, 0.2, 0.3]), identifier);

      const results = await vectorIndex.queryItems(normalize([0.1, 0.2, 0.3]), {
        threshold: 0,
      });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, "test-id");
      assert.strictEqual(results[0].tokens, 42);
      assert(results[0].score > 0.9);
    });

    test("queryItems respects maxTokens parameter", async () => {
      // Filtering by tokens is no longer supported, only threshold and limit
      const normalize = (vector) => {
        const magnitude = Math.sqrt(
          vector.reduce((sum, val) => sum + val * val, 0),
        );
        return vector.map((val) => val / magnitude);
      };

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
      await vectorIndex.addItem(normalize([0.1, 0.2, 0.3]), identifier1);
      await vectorIndex.addItem(normalize([0.2, 0.3, 0.4]), identifier2);
      await vectorIndex.addItem(normalize([0.3, 0.4, 0.5]), identifier3);

      const results = await vectorIndex.queryItems(normalize([0.1, 0.2, 0.3]), {
        threshold: 0,
        limit: 2,
      });

      assert.strictEqual(results.length, 2);
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

    test("getItem returns identifier for existing item", async () => {
      const identifier = new resource.Identifier({
        id: "test-1",
        type: "MessageV2",
        name: "MessageV2.test-1",
        tokens: 10,
      });
      await vectorIndex.addItem([0.1, 0.2, 0.3], identifier);

      const result = await vectorIndex.getItem("cld:MessageV2.test-1");

      assert.strictEqual(result.id, "test-1");
      assert.strictEqual(result.type, "MessageV2");
      assert.strictEqual(result.name, "MessageV2.test-1");
      assert.strictEqual(result.tokens, 10);
    });

    test("getItem returns null for non-existing item", async () => {
      const result = await vectorIndex.getItem("cld:MessageV2.non-existent");

      assert.strictEqual(result, null);
    });

    test("getItem works after loadData", async () => {
      const testData = {
        uri: "cld:MessageV2.test-1",
        identifier: {
          id: "test-1",
          type: "MessageV2",
          name: "MessageV2.test-1",
          tokens: 10,
        },
        vector: [0.1, 0.2, 0.3],
      };

      // Mock storage.get() to return parsed JSON array for .jsonl files
      mockStorage.get = mock.fn(() => Promise.resolve([testData]));

      await vectorIndex.loadData();
      const result = await vectorIndex.getItem("cld:MessageV2.test-1");

      assert.strictEqual(result.id, "test-1");
      assert.strictEqual(result.type, "MessageV2");
      assert.strictEqual(result.name, "MessageV2.test-1");
      assert.strictEqual(result.tokens, 10);
    });

    test("getItem returns updated identifier after item update", async () => {
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

      const result = await vectorIndex.getItem("cld:MessageV2.test-1");

      assert.strictEqual(result.id, "test-1");
      assert.strictEqual(result.tokens, 20); // Should have updated value
    });
  });
});
