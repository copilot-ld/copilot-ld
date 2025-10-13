/* eslint-env node */
import { describe, test, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { createDownloader, IndexBase } from "../index.js";

describe("libutil", () => {
  describe("IndexBase", () => {
    test("is exported and can be extended", () => {
      assert.ok(IndexBase, "IndexBase should be exported");
      assert.strictEqual(
        typeof IndexBase,
        "function",
        "IndexBase should be a constructor",
      );

      // Test that it can be extended
      class TestIndex extends IndexBase {
        constructor(storage) {
          super(storage, "test.jsonl");
        }
      }

      const mockStorage = {
        exists: () => Promise.resolve(false),
        get: () => Promise.resolve([]),
        append: () => Promise.resolve(),
      };

      const testIndex = new TestIndex(mockStorage);
      assert.ok(testIndex, "Should be able to create subclass instance");
      assert.strictEqual(
        testIndex.indexKey,
        "test.jsonl",
        "Should inherit properties",
      );
    });
  });

  describe("downloadFactory", () => {
    test("creates Download instance with correct dependencies", () => {
      const mockStorageFactory = mock.fn();
      const mockProcess = { env: { STORAGE_TYPE: "local" } };

      const downloader = createDownloader(mockStorageFactory, mockProcess);

      assert.ok(downloader);
      // Check that it's a Download instance by checking if it has the expected methods
      assert.ok(typeof downloader.initialize === "function");
      assert.ok(typeof downloader.download === "function");
    });

    test("validates storageFactory parameter", () => {
      assert.throws(() => createDownloader(null), {
        message: /createStorage is required/,
      });
    });

    test("uses global process when not provided", () => {
      const mockStorageFactory = mock.fn();

      const downloader = createDownloader(mockStorageFactory);

      assert.ok(downloader);
    });
  });
});
