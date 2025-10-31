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
      assert.strictEqual(VectorService.length, 5); // config, contentIndex, descriptorIndex, llmClient, logFn
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
    });

    test("creates service instance with indexes", () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        mockLlmClient,
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
      );

      const result = await service.QueryByContent({
        text: "test query",
        filter: { threshold: 0.3, limit: 10 },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
    });

    test("QueryByDescriptor queries descriptor index", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        mockLlmClient,
      );

      const result = await service.QueryByDescriptor({
        text: "test descriptor query",
        filter: { threshold: 0.3, limit: 10 },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
    });

    test("QueryByContent handles empty filters", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
        mockLlmClient,
      );

      const result = await service.QueryByContent({
        text: "test query",
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
    });
  });
});
