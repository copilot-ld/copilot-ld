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

    test("ensureBucket returns false when directory exists", async () => {
      const created = await localStorage.ensureBucket();

      assert.strictEqual(created, false);
      assert.strictEqual(mockFs.access.mock.callCount(), 1);
      assert.strictEqual(mockFs.mkdir.mock.callCount(), 0);
    });

    test("ensureBucket returns true when directory is created", async () => {
      mockFs.access = mock.fn(() => Promise.reject(new Error("Not found")));

      const created = await localStorage.ensureBucket();

      assert.strictEqual(created, true);
      assert.strictEqual(mockFs.access.mock.callCount(), 1);
      assert.strictEqual(mockFs.mkdir.mock.callCount(), 1);
      assert.deepStrictEqual(mockFs.mkdir.mock.calls[0].arguments, [
        "/test/base",
        { recursive: true },
      ]);
    });

    test("bucketExists returns true when directory exists", async () => {
      const exists = await localStorage.bucketExists();

      assert.strictEqual(exists, true);
      assert.strictEqual(mockFs.access.mock.callCount(), 1);
    });

    test("bucketExists returns false when directory missing", async () => {
      mockFs.access = mock.fn(() => Promise.reject(new Error("Not found")));

      const exists = await localStorage.bucketExists();

      assert.strictEqual(exists, false);
      assert.strictEqual(mockFs.access.mock.callCount(), 1);
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

      // Mock commands as constructor functions
      mockCommands = {
        PutObjectCommand: mock.fn(function (params) {
          this.params = params;
          return this;
        }),
        GetObjectCommand: mock.fn(function (params) {
          this.params = params;
          return this;
        }),
        DeleteObjectCommand: mock.fn(function (params) {
          this.params = params;
          return this;
        }),
        HeadObjectCommand: mock.fn(function (params) {
          this.params = params;
          return this;
        }),
        ListObjectsV2Command: mock.fn(function (params) {
          this.params = params;
          return this;
        }),
        CreateBucketCommand: mock.fn(function (params) {
          this.params = params;
          return this;
        }),
        HeadBucketCommand: mock.fn(function (params) {
          this.params = params;
          return this;
        }),
      };

      s3Storage = new S3Storage("test-bucket", mockClient, mockCommands);
    });

    test("put sends PutObjectCommand", async () => {
      await s3Storage.put("file.txt", "content");

      assert.strictEqual(mockClient.send.mock.callCount(), 1);
      assert.strictEqual(mockCommands.PutObjectCommand.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockCommands.PutObjectCommand.mock.calls[0].arguments[0],
        {
          Bucket: "test-bucket",
          Key: "file.txt",
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
          Key: "file.txt",
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

      assert.deepStrictEqual(keys, [
        "test/prefix/file1.txt",
        "test/prefix/file2.txt",
      ]);
    });

    test("handles absolute paths by removing leading slash", async () => {
      await s3Storage.put("/absolute/file.txt", "content");

      assert.deepStrictEqual(
        mockCommands.PutObjectCommand.mock.calls[0].arguments[0].Key,
        "absolute/file.txt",
      );
    });

    test("ensureBucket returns false when bucket exists", async () => {
      const created = await s3Storage.ensureBucket();

      assert.strictEqual(created, false);
      assert.strictEqual(mockCommands.HeadBucketCommand.mock.callCount(), 1);
      assert.strictEqual(mockCommands.CreateBucketCommand.mock.callCount(), 0);
    });

    test("ensureBucket returns true when bucket is created", async () => {
      const error = new Error("Not found");
      error.name = "NotFound";

      // Mock HeadBucketCommand to fail (bucket doesn't exist)
      // Mock CreateBucketCommand to succeed (bucket created)
      let callCount = 0;
      mockClient.send = mock.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call is HeadBucketCommand - bucket doesn't exist
          return Promise.reject(error);
        } else {
          // Second call is CreateBucketCommand - create bucket
          return Promise.resolve();
        }
      });

      const created = await s3Storage.ensureBucket();

      assert.strictEqual(created, true);
      assert.strictEqual(mockClient.send.mock.callCount(), 2);
    });

    test("ensureBucket handles NoSuchBucket error", async () => {
      const error = new Error("No such bucket");
      error.Code = "NoSuchBucket";

      let callCount = 0;
      mockClient.send = mock.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(error);
        }
        return Promise.resolve();
      });

      const created = await s3Storage.ensureBucket();

      assert.strictEqual(created, true);
    });

    test("ensureBucket handles 404 status code", async () => {
      const error = new Error("Not found");
      error.$metadata = { httpStatusCode: 404 };

      let callCount = 0;
      mockClient.send = mock.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(error);
        }
        return Promise.resolve();
      });

      const created = await s3Storage.ensureBucket();

      assert.strictEqual(created, true);
    });

    test("bucketExists returns true when bucket exists", async () => {
      const exists = await s3Storage.bucketExists();

      assert.strictEqual(exists, true);
      assert.strictEqual(mockCommands.HeadBucketCommand.mock.callCount(), 1);
    });

    test("bucketExists returns false when bucket not found", async () => {
      const error = new Error("Not found");
      error.name = "NotFound";
      mockClient.send = mock.fn(() => Promise.reject(error));

      const exists = await s3Storage.bucketExists();

      assert.strictEqual(exists, false);
    });

    test("bucketExists returns false when 404 status", async () => {
      const error = new Error("Not found");
      error.$metadata = { httpStatusCode: 404 };
      mockClient.send = mock.fn(() => Promise.reject(error));

      const exists = await s3Storage.bucketExists();

      assert.strictEqual(exists, false);
    });
  });

  describe("storageFactory", () => {
    let mockProcess;

    beforeEach(() => {
      mockProcess = {
        env: {},
      };
    });

    test("creates LocalStorage for local type", () => {
      mockProcess.env.STORAGE_TYPE = "local";

      // Use a known bucket name that has a defined searchItem path
      const storage = storageFactory("config", "local", mockProcess);

      assert(storage instanceof LocalStorage);
    });

    test("creates S3Storage for s3 type", () => {
      mockProcess.env = {
        STORAGE_TYPE: "s3",
        S3_REGION: "us-east-1",
        S3_ENDPOINT: "https://s3.amazonaws.com",
        S3_ACCESS_KEY_ID: "access-key",
        S3_SECRET_ACCESS_KEY: "secret-key",
        S3_BUCKET: "test-bucket",
      };

      const storage = storageFactory("/test/path", "s3", mockProcess);

      assert(storage instanceof S3Storage);
    });

    test("throws error for unsupported storage type", () => {
      mockProcess.env.STORAGE_TYPE = "unsupported";

      assert.throws(
        () => storageFactory("/test/path", "unsupported", mockProcess),
        {
          message: /Unsupported storage type: unsupported/,
        },
      );
    });
  });
});
