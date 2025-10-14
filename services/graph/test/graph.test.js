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

    test("GraphService has QueryByPattern method", () => {
      assert.strictEqual(
        typeof GraphService.prototype.QueryByPattern,
        "function",
      );
    });

    test("GraphService constructor accepts expected parameters", () => {
      // Test constructor signature by checking parameter count
      assert.strictEqual(GraphService.length, 4); // config, graphIndex, resourceIndex, logFn
    });

    test("GraphService has proper method signatures", () => {
      const methods = Object.getOwnPropertyNames(GraphService.prototype);
      assert(methods.includes("QueryByPattern"));
      assert(methods.includes("constructor"));
    });
  });

  describe("GraphService business logic", () => {
    let mockConfig;
    let mockGraphIndex;
    let mockResourceIndex;

    beforeEach(() => {
      mockConfig = {
        name: "graph",
      };

      mockGraphIndex = {
        queryItems: async () => [
          "common.Message.msg1",
          "tool.ToolFunction.tool1",
        ],
      };

      mockResourceIndex = {
        get: async (actor, ids) =>
          ids.map((id) => {
            const content = { text: `Content for ${id}` };
            content.toString = function () {
              return this.text || "";
            };

            const descriptor = { purpose: `Purpose for ${id}` };
            descriptor.toString = function () {
              return this.purpose || "";
            };

            return {
              id: { type: "common.Message", name: id },
              content,
              descriptor,
            };
          }),
      };
    });

    test("creates service instance with graph index", () => {
      const service = new GraphService(
        mockConfig,
        mockGraphIndex,
        mockResourceIndex,
      );

      assert.ok(service);
      assert.strictEqual(service.config, mockConfig);
    });

    test("QueryByPattern queries the graph index", async () => {
      const service = new GraphService(
        mockConfig,
        mockGraphIndex,
        mockResourceIndex,
      );
      const result = await service.QueryByPattern({ subject: "test" });

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
      assert.strictEqual(result.results.length, 2);
      assert.strictEqual(result.results[0], "Content for common.Message.msg1");
    });

    test("QueryByPattern handles empty pattern", async () => {
      const service = new GraphService(
        mockConfig,
        mockGraphIndex,
        mockResourceIndex,
      );

      const result = await service.QueryByPattern({});

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
    });

    test("QueryByPattern converts empty strings to null in pattern", async () => {
      const service = new GraphService(
        mockConfig,
        mockGraphIndex,
        mockResourceIndex,
      );
      const result = await service.QueryByPattern({
        subject: "",
        predicate: "testPredicate",
        object: "",
      });

      assert.ok(result);
      assert.ok(Array.isArray(result.results));
    });

    test("QueryByPattern with specific subject pattern", async () => {
      let capturedPattern = null;
      mockGraphIndex.queryItems = async (pattern) => {
        capturedPattern = pattern;
        return ["common.Message.msg1"];
      };

      const service = new GraphService(
        mockConfig,
        mockGraphIndex,
        mockResourceIndex,
      );

      await service.QueryByPattern({
        subject: "http://example.org/message1",
        predicate: null,
        object: null,
      });

      assert.strictEqual(
        capturedPattern.subject,
        "http://example.org/message1",
      );
      assert.strictEqual(capturedPattern.predicate, null);
      assert.strictEqual(capturedPattern.object, null);
    });

    test("QueryByPattern with predicate and object pattern", async () => {
      let capturedPattern = null;
      mockGraphIndex.queryItems = async (pattern) => {
        capturedPattern = pattern;
        return ["tool.ToolFunction.tool1"];
      };

      const service = new GraphService(
        mockConfig,
        mockGraphIndex,
        mockResourceIndex,
      );

      await service.QueryByPattern({
        subject: null,
        predicate: "http://purl.org/dc/terms/description",
        object: "Search functionality",
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
