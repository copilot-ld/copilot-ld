/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { GraphProcessor } from "../processor.js";
import { resource } from "@copilot-ld/libtype";

describe("GraphProcessor", () => {
  let mockLogger;
  let mockGraphIndex;
  let mockResourceIndex;
  let processor;

  beforeEach(() => {
    mockLogger = {
      debug: () => {},
    };

    mockGraphIndex = {
      add: async () => {},
    };

    mockResourceIndex = {
      findAll: async () => [],
      get: async () => [],
    };

    processor = new GraphProcessor(
      mockGraphIndex,
      mockResourceIndex,
      mockLogger,
    );

    // GraphProcessor accesses this.logger directly, so we need to expose it
    // This is a test-specific workaround for accessing the protected logger
    Object.defineProperty(processor, "logger", {
      get() {
        return mockLogger;
      },
      configurable: true,
    });
  });

  describe("constructor", () => {
    test("creates GraphProcessor with required dependencies", () => {
      assert.ok(processor instanceof GraphProcessor);
    });

    test("validates graphIndex parameter", () => {
      assert.throws(
        () => new GraphProcessor(null, mockResourceIndex, mockLogger),
        { message: /graphIndex is required/ },
      );
    });

    test("validates resourceIndex parameter", () => {
      assert.throws(
        () => new GraphProcessor(mockGraphIndex, null, mockLogger),
        { message: /resourceIndex is required/ },
      );
    });
  });

  describe("processItem", () => {
    test("skips items without N-Quads content", async () => {
      const item = {
        identifier: resource.Identifier.fromObject({
          name: "test",
          type: "resource.Resource",
        }),
        resource: {
          content: {},
        },
      };

      let addCalled = false;
      mockGraphIndex.add = async () => {
        addCalled = true;
      };

      await processor.processItem(item);
      assert.strictEqual(addCalled, false);
    });

    test("processes valid N-Quads content", async () => {
      const nquads = `<http://example.org/person/1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .
<http://example.org/person/1> <http://schema.org/name> "John Doe" .`;

      const item = {
        identifier: resource.Identifier.fromObject({
          name: "test",
          type: "resource.Resource",
        }),
        resource: {
          content: {
            nquads: nquads,
            tokens: 100,
          },
        },
      };

      let addedQuads = null;
      mockGraphIndex.add = async (_identifier, quads) => {
        addedQuads = quads;
      };

      await processor.processItem(item);

      assert.ok(addedQuads !== null);
      assert.strictEqual(addedQuads.length, 2);
      assert.strictEqual(
        addedQuads[0].predicate.value,
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      );
      assert.strictEqual(
        addedQuads[0].object.value,
        "http://schema.org/Person",
      );
    });

    test("sorts quads with rdf:type first", async () => {
      const nquads = `<http://example.org/person/1> <http://schema.org/name> "John Doe" .
<http://example.org/person/1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .
<http://example.org/person/1> <http://schema.org/email> "john@example.org" .`;

      const item = {
        identifier: resource.Identifier.fromObject({
          name: "test",
          type: "resource.Resource",
        }),
        resource: {
          content: {
            nquads: nquads,
            tokens: 100,
          },
        },
      };

      let addedQuads = null;
      mockGraphIndex.add = async (_identifier, quads) => {
        addedQuads = quads;
      };

      await processor.processItem(item);

      assert.ok(addedQuads !== null);
      assert.strictEqual(addedQuads.length, 3);
      // First quad should be rdf:type
      assert.strictEqual(
        addedQuads[0].predicate.value,
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      );
    });

    test("throws error when tokens are missing", async () => {
      const nquads = `<http://example.org/person/1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .`;

      const item = {
        identifier: resource.Identifier.fromObject({
          name: "test",
          type: "resource.Resource",
        }),
        resource: {
          content: {
            nquads: nquads,
          },
        },
      };

      await assert.rejects(() => processor.processItem(item), {
        message: /Resource missing tokens/,
      });
    });

    test("adds tokens to identifier", async () => {
      const nquads = `<http://example.org/person/1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .`;

      const item = {
        identifier: resource.Identifier.fromObject({
          name: "test",
          type: "resource.Resource",
        }),
        resource: {
          content: {
            nquads: nquads,
            tokens: 250,
          },
        },
      };

      let identifierWithTokens = null;
      mockGraphIndex.add = async (identifier, _quads) => {
        identifierWithTokens = identifier;
      };

      await processor.processItem(item);

      assert.strictEqual(identifierWithTokens.tokens, 250);
    });

    test("uses descriptor tokens when content tokens are missing", async () => {
      const nquads = `<http://example.org/person/1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .`;

      const item = {
        identifier: resource.Identifier.fromObject({
          name: "test",
          type: "resource.Resource",
        }),
        resource: {
          content: {
            nquads: nquads,
          },
          descriptor: {
            tokens: 150,
          },
        },
      };

      let identifierWithTokens = null;
      mockGraphIndex.add = async (identifier, _quads) => {
        identifierWithTokens = identifier;
      };

      await processor.processItem(item);

      assert.strictEqual(identifierWithTokens.tokens, 150);
    });

    test("skips items with empty N-Quads", async () => {
      const item = {
        identifier: resource.Identifier.fromObject({
          name: "test",
          type: "resource.Resource",
        }),
        resource: {
          content: {
            nquads: "",
            tokens: 100,
          },
        },
      };

      let addCalled = false;
      mockGraphIndex.add = async () => {
        addCalled = true;
      };

      await processor.processItem(item);
      assert.strictEqual(addCalled, false);
    });
  });
});
