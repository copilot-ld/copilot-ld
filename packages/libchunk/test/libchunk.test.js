/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { ChunkIndex } from "../index.js";

describe("libchunk", () => {
  describe("ChunkIndex", () => {
    let chunkIndex;
    let mockStorage;

    beforeEach(() => {
      mockStorage = {
        exists: mock.fn(() => Promise.resolve(true)),
        get: mock.fn(() => Promise.resolve(Buffer.from("{}"))),
        put: mock.fn(() => Promise.resolve()),
      };

      chunkIndex = new ChunkIndex(mockStorage);
    });

    test("storage returns storage instance", () => {
      assert.strictEqual(chunkIndex.storage(), mockStorage);
    });

    test("getIndexPath returns default path", () => {
      assert.strictEqual(chunkIndex.getIndexPath(), "index.json");
    });

    test("addChunk adds chunk to index", () => {
      const chunkData = {
        id: "test-chunk",
        tokens: 42,
        metadata: "test",
      };

      chunkIndex.addChunk(chunkData);

      // Verify by checking if persist would save the data
      assert.doesNotThrow(() => chunkIndex.persist());
    });

    test("persist saves index to storage", async () => {
      const chunkData = {
        id: "test-chunk",
        tokens: 42,
      };

      chunkIndex.addChunk(chunkData);
      await chunkIndex.persist();

      assert.strictEqual(mockStorage.put.mock.callCount(), 1);
      assert.strictEqual(
        mockStorage.put.mock.calls[0].arguments[0],
        "index.json",
      );
      const savedData = JSON.parse(mockStorage.put.mock.calls[0].arguments[1]);
      assert.deepStrictEqual(savedData["test-chunk"], chunkData);
    });

    test("loadData loads index and chunks", async () => {
      const indexData = {
        "chunk-1": { id: "chunk-1", tokens: 10 },
        "chunk-2": { id: "chunk-2", tokens: 20 },
      };

      mockStorage.get = mock.fn((key) => {
        if (key === "index.json") {
          return Promise.resolve(Buffer.from(JSON.stringify(indexData)));
        }
        if (key === "chunk-1/chunk.json") {
          return Promise.resolve(Buffer.from("First chunk text"));
        }
        if (key === "chunk-2/chunk.json") {
          return Promise.resolve(Buffer.from("Second chunk text"));
        }
        return Promise.resolve(Buffer.from(""));
      });

      await chunkIndex.loadData();

      assert.strictEqual(mockStorage.get.mock.callCount(), 3); // index + 2 chunks
      assert.strictEqual(mockStorage.exists.mock.callCount(), 3); // index + 2 chunk files
    });

    test("loadData throws when index not found", async () => {
      mockStorage.exists = mock.fn(() => Promise.resolve(false));

      await assert.rejects(
        async () => {
          await chunkIndex.loadData();
        },
        { message: /Chunk index not found: index.json/ },
      );
    });

    test("getAllChunks returns all chunks as Chunk objects", async () => {
      const indexData = {
        "chunk-1": { id: "chunk-1", tokens: 10 },
        "chunk-2": { id: "chunk-2", tokens: 20 },
      };

      mockStorage.get = mock.fn((key) => {
        if (key === "index.json") {
          return Promise.resolve(Buffer.from(JSON.stringify(indexData)));
        }
        if (key === "chunk-1/chunk.json") {
          return Promise.resolve(Buffer.from("First chunk text"));
        }
        if (key === "chunk-2/chunk.json") {
          return Promise.resolve(Buffer.from("Second chunk text"));
        }
        return Promise.resolve(Buffer.from(""));
      });

      const chunks = await chunkIndex.getAllChunks();

      assert.strictEqual(Object.keys(chunks).length, 2);
      assert.strictEqual(chunks["chunk-1"].id, "chunk-1");
      assert.strictEqual(chunks["chunk-1"].tokens, 10);
      assert.strictEqual(chunks["chunk-1"].text, "First chunk text");
      assert.strictEqual(chunks["chunk-2"].id, "chunk-2");
      assert.strictEqual(chunks["chunk-2"].tokens, 20);
      assert.strictEqual(chunks["chunk-2"].text, "Second chunk text");
    });

    test("getChunks returns specific chunks by IDs", async () => {
      const indexData = {
        "chunk-1": { id: "chunk-1", tokens: 10 },
        "chunk-2": { id: "chunk-2", tokens: 20 },
        "chunk-3": { id: "chunk-3", tokens: 30 },
      };

      mockStorage.get = mock.fn((key) => {
        if (key === "index.json") {
          return Promise.resolve(Buffer.from(JSON.stringify(indexData)));
        }
        if (key === "chunk-1/chunk.json") {
          return Promise.resolve(Buffer.from("First chunk text"));
        }
        if (key === "chunk-3/chunk.json") {
          return Promise.resolve(Buffer.from("Third chunk text"));
        }
        return Promise.resolve(Buffer.from(""));
      });

      const chunks = await chunkIndex.getChunks([
        "chunk-1",
        "chunk-3",
        "non-existent",
      ]);

      assert.strictEqual(Object.keys(chunks).length, 2);
      assert.strictEqual(chunks["chunk-1"].id, "chunk-1");
      assert.strictEqual(chunks["chunk-1"].text, "First chunk text");
      assert.strictEqual(chunks["chunk-3"].id, "chunk-3");
      assert.strictEqual(chunks["chunk-3"].text, "Third chunk text");
      assert.strictEqual(chunks["non-existent"], undefined);
    });

    test("getChunks handles missing chunk files", async () => {
      const indexData = {
        "chunk-1": { id: "chunk-1", tokens: 10 },
      };

      mockStorage.get = mock.fn((key) => {
        if (key === "index.json") {
          return Promise.resolve(Buffer.from(JSON.stringify(indexData)));
        }
        return Promise.resolve(Buffer.from(""));
      });

      mockStorage.exists = mock.fn((key) => {
        if (key === "index.json") return Promise.resolve(true);
        return Promise.resolve(false); // chunk file doesn't exist
      });

      const chunks = await chunkIndex.getChunks(["chunk-1"]);

      assert.strictEqual(Object.keys(chunks).length, 0);
    });

    test("loads data only once", async () => {
      const indexData = {
        "chunk-1": { id: "chunk-1", tokens: 10 },
      };

      mockStorage.get = mock.fn((key) => {
        if (key === "index.json") {
          return Promise.resolve(Buffer.from(JSON.stringify(indexData)));
        }
        if (key === "chunk-1/chunk.json") {
          return Promise.resolve(Buffer.from("Chunk text"));
        }
        return Promise.resolve(Buffer.from(""));
      });

      // Call multiple methods that trigger loading
      await chunkIndex.getAllChunks();
      await chunkIndex.getChunks(["chunk-1"]);

      // Should only load once
      assert.strictEqual(
        mockStorage.get.mock.calls.filter(
          (call) => call.arguments[0] === "index.json",
        ).length,
        1,
      );
    });
  });
});
