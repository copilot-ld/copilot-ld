/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { VectorService } from "../index.js";

describe("vector service", () => {
  describe("VectorService", () => {
    test("exports VectorService class", () => {
      assert.strictEqual(typeof VectorService, "function");
      assert.ok(VectorService.prototype);
    });

    test("VectorService has QueryByContent method", () => {
      assert.strictEqual(
        typeof VectorService.prototype.QueryByContent,
        "function",
      );
    });

    test("VectorService has QueryByDescriptor method", () => {
      assert.strictEqual(
        typeof VectorService.prototype.QueryByDescriptor,
        "function",
      );
    });

    test("VectorService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(VectorService.length, 6); // config, contentIndex, descriptorIndex, llmClient, resourceIndex, logFn
    });

    test("VectorService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(VectorService.prototype);
      assert(methods.includes("QueryByContent"));
      assert(methods.includes("QueryByDescriptor"));
      assert(methods.includes("constructor"));
    });
  });

  describe("VectorService business logic", () => {
    let mockConfig;
    let mockContentIndex;
    let mockDescriptorIndex;
    let mockLlmClient;
    let mockResourceIndex;

    beforeEach(() => {
      mockConfig = {
        name: "vector",
        threshold: 0.3,
        limit: 10,
      };

      mockContentIndex = {
        queryItems: async () => [{ toString: () => "msg1" }],
      };

      mockDescriptorIndex = {
        queryItems: async () => [{ toString: () => "desc1" }],
      };

      mockLlmClient = {
        CreateEmbeddings: async () => ({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      };

      mockResourceIndex = {
        get: async (identifiers, _actor) =>
          identifiers.map((id) => ({
            id,
            content: { toString: () => `Content for ${id}` },
            descriptor: { toString: () => `Descriptor for ${id}` },
          })),
      };
    });

    test("creates service instance with indexes", () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        mockLlmClient,
        mockResourceIndex,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("QueryByContent queries content index", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        mockLlmClient,
        mockResourceIndex,
      );

      const result = await service.QueryByContent({
        text: "test query",
        filters: { threshold: "0.3", limit: "10" },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.results[0], "Content for msg1");
    });

    test("QueryByDescriptor queries descriptor index", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        mockLlmClient,
        mockResourceIndex,
      );

      const result = await service.QueryByDescriptor({
        text: "test descriptor query",
        filters: { threshold: "0.3", limit: "10" },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.results[0], "Descriptor for desc1");
    });

    test("QueryByContent handles empty filters", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        mockLlmClient,
        mockResourceIndex,
      );

      const result = await service.QueryByContent({
        text: "test query",
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
    });
  });
});
