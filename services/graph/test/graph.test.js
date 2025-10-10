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
      assert.strictEqual(GraphService.length, 3); // config, graphIndex, logFn
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
    let mockGraphIndex;

    beforeEach(() => {
      mockConfig = {
        name: "graph",
      };

      mockGraphIndex = {
        queryItems: async () => [
          { type: "common.Message", name: "msg1" },
          { type: "common.ToolFunction", name: "tool1" },
        ],
        getItem: async (id) => ({ id, found: true }),
      };
    });

    test("creates service instance with graph index", () => {
      const service = new GraphService(mockConfig, mockGraphIndex);

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("QueryItems queries the graph index", async () => {
      const service = new GraphService(mockConfig, mockGraphIndex);

      const result = await service.QueryItems({
        pattern: {
          subject: "http://example.org/test",
          predicate: null,
          object: null,
        },
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
      assert.strictEqual(result.identifiers.length, 2);
    });

    test("QueryItems handles empty pattern", async () => {
      const service = new GraphService(mockConfig, mockGraphIndex);

      const result = await service.QueryItems({
        pattern: {},
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.identifiers));
    });

    test("QueryItems converts empty strings to null in pattern", async () => {
      let capturedPattern = null;
      mockGraphIndex.queryItems = async (pattern) => {
        capturedPattern = pattern;
        return [];
      };

      const service = new GraphService(mockConfig, mockGraphIndex);

      await service.QueryItems({
        pattern: {
          subject: "",
          predicate: "",
          object: "",
        },
      });

      assert.strictEqual(capturedPattern.subject, null);
      assert.strictEqual(capturedPattern.predicate, null);
      assert.strictEqual(capturedPattern.object, null);
    });

    test("GetItem retrieves item from graph index", async () => {
      const service = new GraphService(mockConfig, mockGraphIndex);

      const result = await service.GetItem({
        id: "common.Message.test",
      });

      assert.ok(result);
      assert.ok(result.identifier);
      assert.strictEqual(result.identifier.id, "common.Message.test");
    });

    test("GetItem returns null identifier when not found", async () => {
      mockGraphIndex.getItem = async () => null;

      const service = new GraphService(mockConfig, mockGraphIndex);

      const result = await service.GetItem({
        id: "nonexistent",
      });

      assert.ok(result);
      assert.strictEqual(result.identifier, null);
    });

    test("QueryItems with specific subject pattern", async () => {
      let capturedPattern = null;
      mockGraphIndex.queryItems = async (pattern) => {
        capturedPattern = pattern;
        return [{ type: "common.Message", name: "msg1" }];
      };

      const service = new GraphService(mockConfig, mockGraphIndex);

      await service.QueryItems({
        pattern: {
          subject: "http://example.org/message1",
          predicate: null,
          object: null,
        },
      });

      assert.strictEqual(
        capturedPattern.subject,
        "http://example.org/message1",
      );
      assert.strictEqual(capturedPattern.predicate, null);
      assert.strictEqual(capturedPattern.object, null);
    });

    test("QueryItems with predicate and object pattern", async () => {
      let capturedPattern = null;
      mockGraphIndex.queryItems = async (pattern) => {
        capturedPattern = pattern;
        return [{ type: "common.ToolFunction", name: "tool1" }];
      };

      const service = new GraphService(mockConfig, mockGraphIndex);

      await service.QueryItems({
        pattern: {
          subject: null,
          predicate: "http://purl.org/dc/terms/description",
          object: "Search functionality",
        },
      });

      assert.strictEqual(capturedPattern.subject, null);
      assert.strictEqual(
        capturedPattern.predicate,
        "http://purl.org/dc/terms/description",
      );
      assert.strictEqual(capturedPattern.object, "Search functionality");
    });
  });
});
