/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { toType, ResourceIndex, ResourceProcessor } from "../index.js";
import { common, resource } from "@copilot-ld/libtype";

/**
 * Creates a mock storage implementation for testing
 * @returns {object} Mock storage instance
 */
function createMockStorage() {
  const data = new Map();

  return {
    async put(key, value) {
      data.set(key, value);
    },

    async get(key) {
      const value = data.get(key);
      if (!value) throw new Error(`Key not found: ${key}`);
      return value;
    },

    async getMany(keys) {
      return keys.map((key) => {
        const value = data.get(key);
        if (!value) throw new Error(`Key not found: ${key}`);
        return value;
      });
    },
  };
}

/**
 * Creates a mock policy implementation for testing
 * @returns {object} Mock policy instance
 */
function createMockPolicy() {
  return {
    async evaluate(_input) {
      // Allow all access for testing
      return true;
    },
  };
}

describe("ResourceIndex", () => {
  let resourceIndex;
  let mockStorage;
  let mockPolicy;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockPolicy = createMockPolicy();
    resourceIndex = new ResourceIndex(mockStorage, mockPolicy);
  });

  test("creates ResourceIndex with required dependencies", () => {
    assert.ok(resourceIndex instanceof ResourceIndex);
  });

  test("throws error when storage is missing", () => {
    assert.throws(() => new ResourceIndex(null, mockPolicy), {
      message: "storage is required",
    });
  });

  test("throws error when policy is missing", () => {
    assert.throws(() => new ResourceIndex(mockStorage, null), {
      message: "policy is required",
    });
  });

  test("puts resource content with identifier generation", async () => {
    const message = new common.MessageV2.fromObject({
      role: "system",
      content: { text: "Test message content" },
    });

    await resourceIndex.put(message);

    // Verify descriptor was generated
    assert.ok(message.id instanceof resource.Identifier);
    assert.strictEqual(message.id.type, "common.MessageV2");
    assert.strictEqual(message.id.name, "common.MessageV2.196e3d58");
  });

  test("gets resource contents by IDs with access control", async () => {
    // First, put a resource
    const message = new common.MessageV2.fromObject({
      role: "system",
      content: { text: "Test message for retrieval" },
    });

    await resourceIndex.put(message);
    const resourceId = message.id;

    // Then get it back
    const retrieved = await resourceIndex.get("test-actor", [resourceId]);

    assert.strictEqual(retrieved.length, 1);
    assert.strictEqual(retrieved[0].role, "system");
    assert.strictEqual(
      String(retrieved[0].content),
      "Test message for retrieval",
    );
    assert.ok(retrieved[0].id instanceof resource.Identifier);
    assert.strictEqual(retrieved[0].id.type, "common.MessageV2");
    assert.strictEqual(retrieved[0].id.name, "common.MessageV2.ef1bbc13");
  });
});

describe("ResourceProcessor", () => {
  let resourceIndex;
  let configStorage;
  let knowledgeStorage;
  let llm;
  let logger;
  let processor;

  beforeEach(() => {
    resourceIndex = {
      put: async (_resource) => {},
    };

    configStorage = {
      get: async (_key) => {
        // Mock config storage
        return "";
      },
    };

    knowledgeStorage = {
      findByExtension: async (extension) => {
        if (extension === ".html") {
          return ["test.html"];
        }
        return [];
      },
      get: async (key) => {
        if (key === "test.html") {
          return '<div itemscope itemtype="http://schema.org/Article"><h1 itemprop="headline">Test Article</h1></div>';
        }
        return "";
      },
    };

    logger = {
      debug: () => {}, // Mock logger
    };

    llm = {
      createCompletions: async (_params) => {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  purpose:
                    "Provide information about articles and their content",
                  applicability: "Use when displaying article metadata",
                  evaluation: "Article displays correctly with proper metadata",
                }),
              },
            },
          ],
        };
      },
    };

    processor = new ResourceProcessor(
      resourceIndex,
      configStorage,
      knowledgeStorage,
      llm,
      logger,
    );
  });

  test("creates ResourceProcessor instance", () => {
    assert.ok(processor instanceof ResourceProcessor);
  });

  test("processes HTML files into resource contents", async () => {
    // Start with an empty message
    let message;

    // Capture the resource content on the mock
    resourceIndex.put = async (resource) => {
      message = resource;
      message.withIdentifier(); // As the real implementation would do
    };

    await processor.processKnowledge(".html", []);

    assert.ok(message instanceof common.MessageV2);
    assert.ok(message.id instanceof resource.Identifier);
    assert.ok(message.content instanceof resource.Content);
    assert.strictEqual(message.id.type, "common.MessageV2");
    assert.strictEqual(message.role, "system");
    assert.ok(message.content.jsonld);

    const jsonld = JSON.parse(String(message.content));
    assert.strictEqual(jsonld["@type"], "Article");
    assert.strictEqual(jsonld["@context"], "http://schema.org/");
    assert.strictEqual(jsonld.headline, "Test Article");
  });

  test("handles empty HTML file list", async () => {
    knowledgeStorage.findByExtension = async () => [];

    // Should not throw any errors
    await processor.processKnowledge(".html", []);
  });

  test("handles LLM response parsing errors gracefully", async () => {
    // Mock LLM that returns invalid JSON
    const llmWithInvalidResponse = {
      createCompletions: async (_params) => {
        return {
          choices: [
            {
              message: {
                content:
                  "This is not valid JSON and will cause parsing to fail",
              },
            },
          ],
        };
      },
    };

    // Create processor with broken LLM
    const processorWithBrokenLlm = new ResourceProcessor(
      resourceIndex,
      configStorage,
      knowledgeStorage,
      llmWithInvalidResponse,
      logger,
    );

    let putCallCount = 0;
    resourceIndex.put = async (_resource) => {
      putCallCount++;
    };

    // Should not throw an error, but should skip the problematic items
    await processorWithBrokenLlm.processKnowledge(".html", []);

    // Verify that no resources were put because of parsing failures
    assert.strictEqual(putCallCount, 0);
  });
});

describe("toType helper function", () => {
  test("toType correctly creates type based on identifier", () => {
    const object = {
      id: {
        type: "common.MessageV2",
      },
      role: "user",
      content: { text: "Hello, world!" },
    };

    const message = toType(object);
    assert.ok(message instanceof common.MessageV2);
    assert.ok(message.id instanceof resource.Identifier);
  });

  test("toType throws an error on invalid types", () => {
    const object = {
      id: {
        type: "invalid.Type",
      },
      role: "user",
      content: { text: "Hello, world!" },
    };

    assert.throws(
      () => {
        toType(object);
      },
      {
        message: "Unknown type: invalid.Type",
      },
    );
  });
});
