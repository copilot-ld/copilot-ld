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

    test("VectorService has QueryItems method", () => {
      assert.strictEqual(typeof VectorService.prototype.QueryItems, "function");
    });

    test("VectorService has GetItem method", () => {
      assert.strictEqual(typeof VectorService.prototype.GetItem, "function");
    });

    test("VectorService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(VectorService.length, 4); // config, contentIndex, descriptorIndex, logFn
    });

    test("VectorService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(VectorService.prototype);
      assert(methods.includes("QueryItems"));
      assert(methods.includes("GetItem"));
      assert(methods.includes("constructor"));
    });
  });

  describe("VectorService business logic", () => {
    let mockConfig;
    let mockContentIndex;
    let mockDescriptorIndex;

    beforeEach(() => {
      mockConfig = {
        name: "vector",
        threshold: 0.3,
        limit: 10,
      };

      mockContentIndex = {
        queryItems: async () => [
          { type: "common.MessageV2", name: "msg1", score: 0.8 },
        ],
        getItem: async (id) => ({ id, found: true }),
      };

      mockDescriptorIndex = {
        queryItems: async () => [
          { type: "resource.Descriptor", name: "desc1", score: 0.9 },
        ],
        getItem: async (id) => ({ id, found: true }),
      };
    });

    test("creates service instance with indexes", () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("QueryItems uses content index by default", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      const result = await service.QueryItems({
        vector: [0.1, 0.2, 0.3],
        filters: { threshold: 0.3, limit: 10 },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
      assert.strictEqual(result.identifiers.length, 1);
      assert.strictEqual(result.identifiers[0].type, "common.MessageV2");
    });

    test("QueryItems uses descriptor index when specified", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      const result = await service.QueryItems({
        index: "descriptor",
        vector: [0.1, 0.2, 0.3],
        filters: { threshold: 0.3, limit: 10 },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
      assert.strictEqual(result.identifiers.length, 1);
      assert.strictEqual(result.identifiers[0].type, "resource.Descriptor");
    });

    test("GetItem uses content index by default", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      const result = await service.GetItem({
        id: "test-id",
      });

      assert.ok(result);
      assert.ok(result.identifier);
      assert.strictEqual(result.identifier.id, "test-id");
    });

    test("GetItem uses descriptor index when specified", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      const result = await service.GetItem({
        index: "descriptor",
        id: "test-desc-id",
      });

      assert.ok(result);
      assert.ok(result.identifier);
      assert.strictEqual(result.identifier.id, "test-desc-id");
    });

    test("QueryItems handles empty filters", async () => {
      const service = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      const result = await service.QueryItems({
        vector: [0.1, 0.2, 0.3],
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
    });
  });
});
