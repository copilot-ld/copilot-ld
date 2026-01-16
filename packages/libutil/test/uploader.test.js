import { strict as assert } from "node:assert";
import { test, describe, beforeEach } from "node:test";

import { createSilentLogger } from "@copilot-ld/libharness";

import { Uploader } from "../uploader.js";

describe("Uploader", () => {
  let mockStorageFactory;
  let mockLogger;
  let mockLocalStorage;
  let mockRemoteStorage;

  beforeEach(() => {
    mockLocalStorage = {
      list: async () => [],
      get: async () => "test data",
    };

    mockRemoteStorage = {
      ensureBucket: async () => {},
      put: async () => {},
    };

    mockStorageFactory = (prefix, type) => {
      return type === "local" ? mockLocalStorage : mockRemoteStorage;
    };

    mockLogger = createSilentLogger();
  });

  test("constructor validates required dependencies", () => {
    assert.throws(
      () => new Uploader(null, mockLogger),
      /createStorageFn is required/,
    );

    assert.throws(
      () => new Uploader(mockStorageFactory, null),
      /logger is required/,
    );
  });

  test("filters hidden files starting with dot during upload", async () => {
    const uploadedKeys = [];
    mockLocalStorage.list = async () => [
      "file1.txt",
      ".hidden",
      "file2.txt",
      ".DS_Store",
    ];
    mockRemoteStorage.put = async (key, _data) => {
      uploadedKeys.push(key);
    };

    const upload = new Uploader(mockStorageFactory, mockLogger, ["test"]);
    await upload.initialize();
    await upload.upload();

    assert.deepStrictEqual(uploadedKeys, ["file1.txt", "file2.txt"]);
    assert.strictEqual(uploadedKeys.includes(".hidden"), false);
    assert.strictEqual(uploadedKeys.includes(".DS_Store"), false);
  });

  test("uploads all files from multiple prefixes", async () => {
    const uploadedItems = [];
    mockLocalStorage.list = async () => ["file1.txt", "file2.txt"];
    mockRemoteStorage.put = async (key) => {
      uploadedItems.push({ key, data: "test data" });
    };

    const upload = new Uploader(mockStorageFactory, mockLogger, [
      "prefix1",
      "prefix2",
    ]);
    await upload.initialize();
    await upload.upload();

    // Should upload files for both prefixes
    assert.strictEqual(uploadedItems.length, 4); // 2 files × 2 prefixes
    assert.strictEqual(uploadedItems[0].data, "test data");
  });

  test("initializes storage instances for all prefixes", async () => {
    const ensureBucketCalls = [];
    mockRemoteStorage.ensureBucket = async () => {
      ensureBucketCalls.push(true);
    };

    const upload = new Uploader(mockStorageFactory, mockLogger, [
      "test1",
      "test2",
    ]);
    await upload.initialize();

    assert.strictEqual(ensureBucketCalls.length, 2);
  });
});
