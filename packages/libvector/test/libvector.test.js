/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { VectorIndex } from "../index.js";

describe("libvector", () => {
  describe("VectorIndex", () => {
    let vectorIndex;
    let mockStorage;

    beforeEach(() => {
      mockStorage = {
        exists: mock.fn(() => Promise.resolve(true)),
        get: mock.fn(() => Promise.resolve(Buffer.from("[]"))),
        put: mock.fn(() => Promise.resolve()),
      };

      vectorIndex = new VectorIndex(mockStorage);
    });

    test("storage returns storage instance", () => {
      assert.strictEqual(vectorIndex.storage(), mockStorage);
    });

    test("addItem adds new vector", async () => {
      await vectorIndex.addItem("test-1", [0.1, 0.2, 0.3], 10, "test-scope");

      // Verify item was added by checking internal state
      assert(await vectorIndex.hasItem("test-1"));
    });

    test("addItem updates existing vector", async () => {
      await vectorIndex.addItem("test-1", [0.1, 0.2, 0.3], 10);
      await vectorIndex.addItem("test-1", [0.4, 0.5, 0.6], 20);

      assert(await vectorIndex.hasItem("test-1"));
    });

    test("hasItem returns true for existing item", async () => {
      await vectorIndex.addItem("test-1", [0.1, 0.2, 0.3]);

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
          scope: "test",
        },
      ];

      mockStorage.get = mock.fn(() =>
        Promise.resolve(Buffer.from(JSON.stringify(testData))),
      );

      await vectorIndex.loadData();

      assert.strictEqual(mockStorage.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockStorage.get.mock.calls[0].arguments, [
        "index.json",
      ]);
    });

    test("loadData throws when index not found", async () => {
      mockStorage.exists = mock.fn(() => Promise.resolve(false));

      await assert.rejects(
        async () => {
          await vectorIndex.loadData();
        },
        { message: /Vector index not found/ },
      );
    });

    test("persist saves to storage", async () => {
      await vectorIndex.addItem("test-1", [0.1, 0.2, 0.3]);
      await vectorIndex.persist();

      assert.strictEqual(mockStorage.put.mock.callCount(), 1);
      assert.strictEqual(
        mockStorage.put.mock.calls[0].arguments[0],
        "index.json",
      );
    });

    test("queryItems returns similar vectors", async () => {
      await vectorIndex.addItem("similar", [0.1, 0.2, 0.3], 10);
      await vectorIndex.addItem("different", [0.9, 0.8, 0.7], 15);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], 0.5);

      // Should return vectors above threshold - both might be above threshold depending on calculation
      assert(results.length >= 1);
      assert(results.some((r) => r.id === "similar"));
      assert(results[0].score > 0.5); // At least above threshold
    });

    test("queryItems respects threshold", async () => {
      await vectorIndex.addItem("item1", [0.1, 0.2, 0.3], 10);
      await vectorIndex.addItem("item2", [0.9, 0.8, 0.7], 15);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], 0.9);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, "item1");
    });

    test("queryItems respects limit", async () => {
      await vectorIndex.addItem("item1", [0.1, 0.2, 0.3], 10);
      await vectorIndex.addItem("item2", [0.2, 0.3, 0.4], 15);
      await vectorIndex.addItem("item3", [0.3, 0.4, 0.5], 20);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], 0, 2);

      assert.strictEqual(results.length, 2);
      // Results should be sorted by score descending
      assert(results[0].score >= results[1].score);
    });

    test("queryItems returns empty array for no matches", async () => {
      await vectorIndex.addItem("item1", [0.9, 0.8, 0.7], 10);

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], 0.9);

      assert.strictEqual(results.length, 0);
    });

    test("queryItems includes metadata in results", async () => {
      await vectorIndex.addItem("test-item", [0.1, 0.2, 0.3], 42, "test-scope");

      const results = await vectorIndex.queryItems([0.1, 0.2, 0.3], 0);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, "test-item");
      assert.strictEqual(results[0].tokens, 42);
      assert.strictEqual(results[0].scope, "test-scope");
      assert(results[0].score > 0.9);
    });
  });
});
