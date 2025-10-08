/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { Store } from "n3";

import { TripleIndex, parseTripleQuery } from "../index.js";
import { resource } from "@copilot-ld/libtype";

/**
 * Helper function to convert JSON-LD to quads for testing
 * @param {object} jsonld - JSON-LD document
 * @returns {object[]} Array of quad-like objects
 */
function jsonldToQuads(jsonld) {
  const quads = [];

  // Add type if present
  if (jsonld["@type"]) {
    quads.push({
      subject: jsonld["@id"] || "",
      predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      object: jsonld["@type"],
    });
  }

  // Add other properties
  for (const [key, value] of Object.entries(jsonld)) {
    if (key.startsWith("@")) continue; // Skip JSON-LD keywords

    // Expand prefixed properties if needed
    let predicate = key;
    if (key.includes(":") && jsonld["@context"]) {
      const [prefix, localPart] = key.split(":");
      if (jsonld["@context"][prefix]) {
        predicate = jsonld["@context"][prefix] + localPart;
      }
    }

    quads.push({
      subject: jsonld["@id"] || "",
      predicate: predicate,
      object: String(value),
    });
  }

  return quads;
}

describe("libtriple", () => {
  describe("TripleIndex - Essential Functionality", () => {
    let tripleIndex;
    let mockStorage;
    let n3Store;

    beforeEach(() => {
      // Simple mock storage that doesn't persist data (like the demo)
      mockStorage = {
        exists: () => Promise.resolve(false),
        get: () => Promise.resolve([]),
        append: () => Promise.resolve(),
      };

      n3Store = new Store();
      tripleIndex = new TripleIndex(mockStorage, n3Store, "test.jsonl");
    });

    test("multiple resources can be added and queried selectively", async () => {
      // Create multiple test resources with different types and properties
      const resources = [
        {
          identifier: resource.Identifier.fromObject({
            type: "common.MessageV2",
            name: "user-message",
          }),
          jsonld: {
            "@context": {
              "@vocab": "http://schema.org/",
              dcterms: "http://purl.org/dc/terms/",
            },
            "@id": "http://example.org/message1",
            "@type": "MessageV2",
            "dcterms:description": "User message about JavaScript",
            "dcterms:creator": "user123",
            "dcterms:subject": "javascript",
          },
        },
        {
          identifier: resource.Identifier.fromObject({
            type: "common.ToolFunction",
            name: "search-tool",
          }),
          jsonld: {
            "@context": {
              "@vocab": "http://schema.org/",
              dcterms: "http://purl.org/dc/terms/",
            },
            "@id": "http://example.org/tool1",
            "@type": "ToolFunction",
            "dcterms:description": "Search functionality",
            "dcterms:creator": "system",
            "dcterms:subject": "search",
          },
        },
        {
          identifier: resource.Identifier.fromObject({
            type: "common.MessageV2",
            name: "assistant-message",
          }),
          jsonld: {
            "@context": {
              "@vocab": "http://schema.org/",
              dcterms: "http://purl.org/dc/terms/",
            },
            "@id": "http://example.org/message2",
            "@type": "MessageV2",
            "dcterms:description": "Assistant response about Python",
            "dcterms:creator": "assistant",
            "dcterms:subject": "python",
          },
        },
      ];

      // Add all resources to the index
      for (const { identifier, jsonld } of resources) {
        const quads = jsonldToQuads(jsonld);
        await tripleIndex.addItem(quads, identifier, jsonld["@id"]);
      }

      // Test 1: Query by type - should find only MessageV2 resources
      const messagePattern = {
        subject: null,
        predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        object: "MessageV2",
      };
      const messageResults = await tripleIndex.queryItems(messagePattern);
      assert.strictEqual(
        messageResults.length,
        2,
        "Should find 2 MessageV2 resources",
      );
      assert(
        messageResults.some(
          (r) => String(r) === "common.MessageV2.user-message",
        ),
        "Should include user message",
      );
      assert(
        messageResults.some(
          (r) => String(r) === "common.MessageV2.assistant-message",
        ),
        "Should include assistant message",
      );

      // Test 2: Query by type - should find only ToolFunction resources
      const toolPattern = {
        subject: null,
        predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        object: "ToolFunction",
      };
      const toolResults = await tripleIndex.queryItems(toolPattern);
      assert.strictEqual(
        toolResults.length,
        1,
        "Should find 1 ToolFunction resource",
      );
      assert.strictEqual(
        String(toolResults[0]),
        "common.ToolFunction.search-tool",
        "Should find search tool",
      );

      // Test 3: Query by creator - should find only system resources
      const systemPattern = {
        subject: null,
        predicate: "http://purl.org/dc/terms/creator",
        object: "system",
      };
      const systemResults = await tripleIndex.queryItems(systemPattern);
      assert.strictEqual(
        systemResults.length,
        1,
        "Should find 1 system resource",
      );
      assert.strictEqual(
        String(systemResults[0]),
        "common.ToolFunction.search-tool",
        "Should find search tool created by system",
      );

      // Test 4: Query by specific subject - should find only JavaScript resource
      const jsPattern = {
        subject: null,
        predicate: "http://purl.org/dc/terms/subject",
        object: "javascript",
      };
      const jsResults = await tripleIndex.queryItems(jsPattern);
      assert.strictEqual(
        jsResults.length,
        1,
        "Should find 1 JavaScript resource",
      );
      assert.strictEqual(
        String(jsResults[0]),
        "common.MessageV2.user-message",
        "Should find user message about JavaScript",
      );

      // Test 5: Query by specific ID - should find exactly one resource
      const specificPattern = {
        subject: "http://example.org/message1",
        predicate: null,
        object: null,
      };
      const specificResults = await tripleIndex.queryItems(specificPattern);
      assert.strictEqual(
        specificResults.length,
        1,
        "Should find 1 specific resource",
      );
      assert.strictEqual(
        String(specificResults[0]),
        "common.MessageV2.user-message",
        "Should find user message by ID",
      );

      // Test 6: Non-matching query - should find nothing
      const nonExistentPattern = {
        subject: "http://example.org/nonexistent",
        predicate: null,
        object: null,
      };
      const nonExistentResults =
        await tripleIndex.queryItems(nonExistentPattern);
      assert.strictEqual(
        nonExistentResults.length,
        0,
        "Should find no non-existent resources",
      );
    });

    test("individual resource operations work correctly", async () => {
      const identifier = resource.Identifier.fromObject({
        type: "common.MessageV2",
        name: "test-message",
      });

      const jsonld = {
        "@context": { "@vocab": "http://schema.org/" },
        "@id": "http://example.org/test",
        "@type": "MessageV2",
        description: "Test content",
      };

      // Test hasItem returns false before adding
      const hasBeforeAdd = await tripleIndex.hasItem(String(identifier));
      assert.strictEqual(
        hasBeforeAdd,
        false,
        "Should not have item before adding",
      );

      // Test getItem returns null before adding
      const getBeforeAdd = await tripleIndex.getItem(String(identifier));
      assert.strictEqual(
        getBeforeAdd,
        null,
        "Should return null before adding",
      );

      // Add the item
      const quads = jsonldToQuads(jsonld);
      await tripleIndex.addItem(quads, identifier, jsonld["@id"]);

      // Test hasItem returns true after adding
      const hasAfterAdd = await tripleIndex.hasItem(String(identifier));
      assert.strictEqual(hasAfterAdd, true, "Should have item after adding");

      // Test getItem returns identifier after adding
      const getAfterAdd = await tripleIndex.getItem(String(identifier));
      assert.strictEqual(
        String(getAfterAdd),
        String(identifier),
        "Should return correct identifier after adding",
      );
    });

    test("constructor validation works correctly", () => {
      // Test missing storage
      assert.throws(
        () => new TripleIndex(null, new Store()),
        /storage is required/,
        "Should throw for missing storage",
      );

      // Test missing store
      assert.throws(
        () => new TripleIndex(mockStorage, null),
        /store must be an N3 Store instance/,
        "Should throw for missing store",
      );

      // Test invalid store
      assert.throws(
        () => new TripleIndex(mockStorage, {}),
        /store must be an N3 Store instance/,
        "Should throw for invalid store",
      );
    });

    test("accessor methods return correct instances", () => {
      assert.strictEqual(
        tripleIndex.storage(),
        mockStorage,
        "storage() should return storage instance",
      );
      assert.strictEqual(
        tripleIndex.indexKey,
        "test.jsonl",
        "indexKey should return correct key",
      );
    });
  });

  describe("parseTripleQuery", () => {
    test("parses simple triple query with wildcards", () => {
      const result = parseTripleQuery("person:john ? ?");
      assert.deepStrictEqual(result, {
        subject: "person:john",
        predicate: null,
        object: null,
      });
    });

    test("parses triple query with quoted object", () => {
      const result = parseTripleQuery('? foaf:name "John Doe"');
      assert.deepStrictEqual(result, {
        subject: null,
        predicate: "foaf:name",
        object: "John Doe",
      });
    });

    test("parses triple query with all fields specified", () => {
      const result = parseTripleQuery("person:john foaf:name person:john");
      assert.deepStrictEqual(result, {
        subject: "person:john",
        predicate: "foaf:name",
        object: "person:john",
      });
    });

    test("parses triple query with all wildcards", () => {
      const result = parseTripleQuery("? ? ?");
      assert.deepStrictEqual(result, {
        subject: null,
        predicate: null,
        object: null,
      });
    });

    test("handles quoted strings with spaces", () => {
      const result = parseTripleQuery(
        'person:john foaf:name "John Q. Doe Jr."',
      );
      assert.deepStrictEqual(result, {
        subject: "person:john",
        predicate: "foaf:name",
        object: "John Q. Doe Jr.",
      });
    });

    test("throws error for empty line", () => {
      assert.throws(() => parseTripleQuery(""), /line cannot be empty/);
    });

    test("throws error for non-string input", () => {
      assert.throws(() => parseTripleQuery(null), /line must be a string/);
    });

    test("throws error for wrong number of parts", () => {
      assert.throws(
        () => parseTripleQuery("person:john foaf:name"),
        /Expected 3 parts/,
      );
    });

    test("throws error for unterminated quotes", () => {
      assert.throws(
        () => parseTripleQuery('person:john foaf:name "unterminated'),
        /Unterminated quoted string/,
      );
    });
  });
});
