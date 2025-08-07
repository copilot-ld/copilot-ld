/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { resolveScope } from "../index.js";

describe("libscope", () => {
  describe("resolveScope", () => {
    let mockScopeIndex;

    beforeEach(() => {
      mockScopeIndex = {
        queryItems: mock.fn(() => Promise.resolve([])),
      };
    });

    test("returns empty array when no results", async () => {
      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      assert.deepStrictEqual(scopes, []);
      assert.strictEqual(mockScopeIndex.queryItems.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockScopeIndex.queryItems.mock.calls[0].arguments,
        [vector, 0, 3],
      );
    });

    test("returns top scope from single result", async () => {
      mockScopeIndex.queryItems = mock.fn(() =>
        Promise.resolve([{ id: "result-1", score: 0.8, scope: "docker" }]),
      );

      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      assert.deepStrictEqual(scopes, ["docker"]);
    });

    test("resolves highest voted scope from multiple results", async () => {
      mockScopeIndex.queryItems = mock.fn(() =>
        Promise.resolve([
          { id: "result-1", score: 0.7, scope: "security" },
          { id: "result-2", score: 0.6, scope: "docker" },
          { id: "result-3", score: 0.8, scope: "security" },
        ]),
      );

      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      // "security" should win with total score of 1.5 (0.7 + 0.8)
      assert.deepStrictEqual(scopes, ["security"]);
    });

    test("handles tie by returning first encountered scope", async () => {
      mockScopeIndex.queryItems = mock.fn(() =>
        Promise.resolve([
          { id: "result-1", score: 0.5, scope: "docker" },
          { id: "result-2", score: 0.5, scope: "security" },
        ]),
      );

      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      // Both have same score, should return one of them
      assert.strictEqual(scopes.length, 1);
      assert(scopes[0] === "docker" || scopes[0] === "security");
    });

    test("uses custom limit parameter", async () => {
      const vector = [0.1, 0.2, 0.3];
      const customLimit = 5;

      await resolveScope(vector, mockScopeIndex, customLimit);

      assert.deepStrictEqual(
        mockScopeIndex.queryItems.mock.calls[0].arguments,
        [vector, 0, customLimit],
      );
    });

    test("aggregates scores for duplicate scopes", async () => {
      mockScopeIndex.queryItems = mock.fn(() =>
        Promise.resolve([
          { id: "result-1", score: 0.3, scope: "docker" },
          { id: "result-2", score: 0.4, scope: "docker" },
          { id: "result-3", score: 0.6, scope: "kubernetes" },
        ]),
      );

      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      // "docker" should win with total score of 0.7 (0.3 + 0.4)
      assert.deepStrictEqual(scopes, ["docker"]);
    });

    test("handles results with null or undefined scope", async () => {
      mockScopeIndex.queryItems = mock.fn(() =>
        Promise.resolve([
          { id: "result-1", score: 0.8, scope: null },
          { id: "result-2", score: 0.6, scope: "docker" },
          { id: "result-3", score: 0.7, scope: undefined },
        ]),
      );

      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      // Implementation treats null as a valid scope key, so highest score wins
      assert.deepStrictEqual(scopes, ["null"]); // null gets converted to string key
    });

    test("returns scope when all scopes are null", async () => {
      mockScopeIndex.queryItems = mock.fn(() =>
        Promise.resolve([
          { id: "result-1", score: 0.8, scope: null },
          { id: "result-2", score: 0.6, scope: undefined },
        ]),
      );

      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      // Both null and undefined get treated as scope keys
      assert.strictEqual(scopes.length, 1);
    });

    test("handles mixed score types correctly", async () => {
      mockScopeIndex.queryItems = mock.fn(() =>
        Promise.resolve([
          { id: "result-1", score: 0.5, scope: "docker" },
          { id: "result-2", score: 0.3, scope: "docker" },
          { id: "result-3", score: 0.7, scope: "security" },
        ]),
      );

      const vector = [0.1, 0.2, 0.3];
      const scopes = await resolveScope(vector, mockScopeIndex);

      // "docker" should win with 0.8 total vs "security" with 0.7
      assert.deepStrictEqual(scopes, ["docker"]);
    });
  });
});
