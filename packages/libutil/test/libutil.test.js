/* eslint-env node */
import { describe, test, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { createDownloader } from "../index.js";

describe("libutil", () => {
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
