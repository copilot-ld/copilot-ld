/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { LocalStorage, S3Storage, storageFactory } from "../index.js";

describe("libstorage", () => {
  describe("LocalStorage", () => {
    let localStorage;
    let mockFs;

    beforeEach(() => {
      mockFs = {
        mkdir: mock.fn(() => Promise.resolve()),
        writeFile: mock.fn(() => Promise.resolve()),
        readFile: mock.fn(() => Promise.resolve(Buffer.from("test data"))),
        unlink: mock.fn(() => Promise.resolve()),
        access: mock.fn(() => Promise.resolve()),
        readdir: mock.fn(() =>
          Promise.resolve([
            { name: "file1.txt", isFile: () => true, isDirectory: () => false },
            { name: "subdir", isFile: () => false, isDirectory: () => true },
          ]),
        ),
      };

      localStorage = new LocalStorage("/test/base", mockFs);
    });

    test("put creates directory and writes file", async () => {
      await localStorage.put("subdir/file.txt", "content");

      assert.strictEqual(mockFs.mkdir.mock.callCount(), 1);
      assert.strictEqual(mockFs.writeFile.mock.callCount(), 1);
      assert.deepStrictEqual(mockFs.writeFile.mock.calls[0].arguments, [
        "/test/base/subdir/file.txt",
        "content",
      ]);
    });

    test("get reads file", async () => {
      const result = await localStorage.get("file.txt");

      assert.strictEqual(mockFs.readFile.mock.callCount(), 1);
      assert.deepStrictEqual(mockFs.readFile.mock.calls[0].arguments, [
        "/test/base/file.txt",
      ]);
      assert(Buffer.isBuffer(result));
    });

    test("delete removes file", async () => {
      await localStorage.delete("file.txt");

      assert.strictEqual(mockFs.unlink.mock.callCount(), 1);
      assert.deepStrictEqual(mockFs.unlink.mock.calls[0].arguments, [
        "/test/base/file.txt",
      ]);
    });

    test("exists returns true when file exists", async () => {
      const exists = await localStorage.exists("file.txt");

      assert.strictEqual(exists, true);
      assert.strictEqual(mockFs.access.mock.callCount(), 1);
    });

    test("exists returns false when file missing", async () => {
      mockFs.access = mock.fn(() => Promise.reject(new Error("Not found")));

      const exists = await localStorage.exists("file.txt");

      assert.strictEqual(exists, false);
    });

    test("handles absolute paths", async () => {
      await localStorage.put("/absolute/path/file.txt", "content");

      assert.deepStrictEqual(
        mockFs.writeFile.mock.calls[0].arguments[0],
        "/absolute/path/file.txt",
      );
    });
  });

  describe("S3Storage", () => {
    let s3Storage;
    let mockClient;
    let mockCommands;

    beforeEach(() => {
      mockClient = {
        send: mock.fn(() =>
          Promise.resolve({ Body: [Buffer.from("test data")] }),
        ),
      };

      mockCommands = {
        PutObjectCommand: mock.fn(),
        GetObjectCommand: mock.fn(),
        DeleteObjectCommand: mock.fn(),
        HeadObjectCommand: mock.fn(),
        ListObjectsV2Command: mock.fn(),
      };

      s3Storage = new S3Storage(
        "test/prefix",
        "test-bucket",
        mockClient,
        mockCommands,
      );
    });

    test("put sends PutObjectCommand", async () => {
      await s3Storage.put("file.txt", "content");

      assert.strictEqual(mockClient.send.mock.callCount(), 1);
      assert.strictEqual(mockCommands.PutObjectCommand.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockCommands.PutObjectCommand.mock.calls[0].arguments[0],
        {
          Bucket: "test-bucket",
          Key: "test/prefix/file.txt",
          Body: "content",
        },
      );
    });

    test("get sends GetObjectCommand and concatenates chunks", async () => {
      mockClient.send = mock.fn(() =>
        Promise.resolve({
          Body: [Buffer.from("chunk1"), Buffer.from("chunk2")],
        }),
      );

      const result = await s3Storage.get("file.txt");

      assert.strictEqual(mockClient.send.mock.callCount(), 1);
      assert.strictEqual(mockCommands.GetObjectCommand.mock.callCount(), 1);
      assert(Buffer.isBuffer(result));
      assert.strictEqual(result.toString(), "chunk1chunk2");
    });

    test("delete sends DeleteObjectCommand", async () => {
      await s3Storage.delete("file.txt");

      assert.strictEqual(mockClient.send.mock.callCount(), 1);
      assert.strictEqual(mockCommands.DeleteObjectCommand.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockCommands.DeleteObjectCommand.mock.calls[0].arguments[0],
        {
          Bucket: "test-bucket",
          Key: "test/prefix/file.txt",
        },
      );
    });

    test("exists returns true when object exists", async () => {
      const exists = await s3Storage.exists("file.txt");

      assert.strictEqual(exists, true);
      assert.strictEqual(mockCommands.HeadObjectCommand.mock.callCount(), 1);
    });

    test("exists returns false when NotFound error", async () => {
      const error = new Error("Not found");
      error.name = "NotFound";
      mockClient.send = mock.fn(() => Promise.reject(error));

      const exists = await s3Storage.exists("file.txt");

      assert.strictEqual(exists, false);
    });

    test("exists returns false when 404 status", async () => {
      const error = new Error("Not found");
      error.$metadata = { httpStatusCode: 404 };
      mockClient.send = mock.fn(() => Promise.reject(error));

      const exists = await s3Storage.exists("file.txt");

      assert.strictEqual(exists, false);
    });

    test("find lists objects with extension", async () => {
      mockClient.send = mock.fn(() =>
        Promise.resolve({
          Contents: [
            { Key: "test/prefix/file1.txt" },
            { Key: "test/prefix/file2.txt" },
            { Key: "test/prefix/other.json" },
          ],
        }),
      );

      const keys = await s3Storage.find(".txt");

      assert.deepStrictEqual(keys, ["file1.txt", "file2.txt"]);
    });

    test("handles absolute paths by removing leading slash", async () => {
      await s3Storage.put("/absolute/file.txt", "content");

      assert.deepStrictEqual(
        mockCommands.PutObjectCommand.mock.calls[0].arguments[0].Key,
        "absolute/file.txt",
      );
    });
  });

  describe("storageFactory", () => {
    test("creates LocalStorage for local type", () => {
      const config = { storage: "local" };
      const storage = storageFactory("/test/path", config);

      assert(storage instanceof LocalStorage);
    });

    test("creates S3Storage for s3 type", () => {
      const config = {
        storage: "s3",
        s3_region: "us-east-1",
        s3_endpoint: "https://s3.amazonaws.com",
        s3_access_key_id: "access-key",
        s3_secret_access_key: "secret-key",
        s3_bucket: "test-bucket",
      };

      const storage = storageFactory("/test/path", config);

      assert(storage instanceof S3Storage);
    });

    test("defaults to LocalStorage", () => {
      const config = {};
      const storage = storageFactory("/test/path", config);

      assert(storage instanceof LocalStorage);
    });

    test("throws error for unsupported storage type", () => {
      const config = { storage: "unsupported" };

      assert.throws(() => storageFactory("/test/path", config), {
        message: /Unsupported storage type: unsupported/,
      });
    });
  });
});
