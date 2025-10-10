/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { GraphService } from "../index.js";

describe("graph service", () => {
  describe("GraphService", () => {
    test("exports GraphService class", () => {
      assert.strictEqual(typeof GraphService, "function");
      assert.ok(GraphService.prototype);
    });

    test("GraphService has QueryItems method", () => {
      assert.strictEqual(typeof GraphService.prototype.QueryItems, "function");
    });

    test("GraphService has GetItem method", () => {
      assert.strictEqual(typeof GraphService.prototype.GetItem, "function");
    });

    test("GraphService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(GraphService.length, 3); // config, tripleIndex, logFn
    });

    test("GraphService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(GraphService.prototype);
      assert(methods.includes("QueryItems"));
      assert(methods.includes("GetItem"));
      assert(methods.includes("constructor"));
    });
  });

  describe("GraphService business logic", () => {
    let mockConfig;
    let mockTripleIndex;

    beforeEach(() => {
      mockConfig = {
        name: "graph",
      };

      mockTripleIndex = {
        queryItems: async () => [{ type: "common.Message", name: "msg1" }],
        getItem: async (id) => ({ id, found: true }),
      };
    });

    test("creates service instance with triple index", () => {
      const service = new GraphService(mockConfig, mockTripleIndex);

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("QueryItems queries triple index with pattern", async () => {
      const service = new GraphService(mockConfig, mockTripleIndex);

      const result = await service.QueryItems({
        pattern: {
          subject: "http://example.org/test",
          predicate: null,
          object: null,
        },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
      assert.strictEqual(result.identifiers.length, 1);
      assert.strictEqual(result.identifiers[0].type, "common.Message");
    });

    test("QueryItems handles empty pattern", async () => {
      const service = new GraphService(mockConfig, mockTripleIndex);

      const result = await service.QueryItems({
        pattern: {},
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
    });

    test("QueryItems handles missing pattern", async () => {
      const service = new GraphService(mockConfig, mockTripleIndex);

      const result = await service.QueryItems({});

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
    });

    test("GetItem retrieves item by ID", async () => {
      const service = new GraphService(mockConfig, mockTripleIndex);

      const result = await service.GetItem({
        id: "test-id",
      });

      assert.ok(result);
      assert.ok(result.identifier);
      assert.strictEqual(result.identifier.id, "test-id");
    });

    test("GetItem returns null for non-existent ID", async () => {
      mockTripleIndex.getItem = async () => null;
      const service = new GraphService(mockConfig, mockTripleIndex);

      const result = await service.GetItem({
        id: "non-existent",
      });

      assert.ok(result);
      assert.strictEqual(result.identifier, null);
    });
  });
});
