/* eslint-env node */
import { strict as assert } from "node:assert";
import { test, describe, beforeEach } from "node:test";

import { Download } from "../download.js";

describe("Download", () => {
  let mockStorageFactory;
  let mockExecFn;
  let mockLogger;
  let mockLocalStorage;
  let mockRemoteStorage;

  beforeEach(() => {
    mockLocalStorage = {
      ensureBucket: async () => {},
      put: async () => {},
      delete: async () => {},
      path: (key) => `/local/path/${key}`,
    };

    mockRemoteStorage = {
      exists: async () => true,
      get: async () => Buffer.from("bundle data"),
    };

    mockStorageFactory = (prefix, type) => {
      return type === "local" ? mockLocalStorage : mockRemoteStorage;
    };

    mockExecFn = () => {};
    mockLogger = { debug: () => {} };
  });

  test("constructor validates required dependencies", () => {
    assert.throws(
      () => new Download(null, mockExecFn, mockLogger),
      /storageFn is required/,
    );

    assert.throws(
      () => new Download(mockStorageFactory, null, mockLogger),
      /execFn is required/,
    );

    assert.throws(
      () => new Download(mockStorageFactory, mockExecFn, null),
      /logger is required/,
    );
  });

  test("downloads and extracts bundle when it exists", async () => {
    const operations = [];
    mockLocalStorage.put = async (key, data) => {
      operations.push({ op: "put", key, hasData: !!data });
    };
    mockLocalStorage.delete = async (key) => {
      operations.push({ op: "delete", key });
    };
    mockExecFn = (command) => {
      operations.push({ op: "extract", command });
    };

    const download = new Download(mockStorageFactory, mockExecFn, mockLogger);
    await download.initialize();
    await download.download();

    assert.strictEqual(operations.length, 3);
    assert.deepStrictEqual(operations[0], {
      op: "put",
      key: "bundle.tar.gz",
      hasData: true,
    });
    assert.strictEqual(operations[1].op, "extract");
    assert.strictEqual(operations[1].command.includes("tar -xzf"), true);
    assert.deepStrictEqual(operations[2], {
      op: "delete",
      key: "bundle.tar.gz",
    });
  });

  test("throws error when bundle does not exist", async () => {
    mockRemoteStorage.exists = async () => false;

    const download = new Download(mockStorageFactory, mockExecFn, mockLogger);
    await download.initialize();

    await assert.rejects(() => download.download(), {
      message: /Bundle not found/,
    });
  });

  test("initializes storage instances correctly", async () => {
    const ensureBucketCalls = [];
    mockLocalStorage.ensureBucket = async () => {
      ensureBucketCalls.push("generated");
    };

    const download = new Download(mockStorageFactory, mockExecFn, mockLogger);
    await download.initialize();

    assert.strictEqual(ensureBucketCalls.length, 1);
    assert.strictEqual(ensureBucketCalls[0], "generated");
  });
});
