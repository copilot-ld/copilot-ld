/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { toType, toIdentifier, ResourceIndex } from "../index.js";
import { ResourceProcessor } from "../processor.js";
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

      // Simulate automatic JSON parsing for .json files
      if (key.endsWith(".json") && typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }

      return value;
    },

    async getMany(keys) {
      const results = {};
      for (const key of keys) {
        try {
          const value = data.get(key);
          if (value) {
            // Simulate automatic JSON parsing for .json files
            if (key.endsWith(".json") && typeof value === "string") {
              try {
                results[key] = JSON.parse(value);
              } catch {
                results[key] = value;
              }
            } else {
              results[key] = value;
            }
          }
        } catch {
          // Skip keys that don't exist
        }
      }
      return results;
    },

    async list() {
      return Array.from(data.keys());
    },

    async findByPrefix(prefix) {
      return Array.from(data.keys()).filter((key) => key.startsWith(prefix));
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
    const message = new common.Message({
      role: "system",
      content: { text: "Test message content" },
    });

    await resourceIndex.put(message);

    // Verify descriptor was generated
    assert.ok(message.id instanceof resource.Identifier);
    assert.strictEqual(message.id.type, "common.Message");
    assert.strictEqual(message.id.name, "a50a3807");
  });

  test("gets resource contents by IDs with access control", async () => {
    // First, put a resource
    const message = new common.Message({
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
    assert.strictEqual(retrieved[0].id.type, "common.Message");
    assert.strictEqual(retrieved[0].id.name, "a50a3807");
  });

  test("returns empty array when passed null identifiers", async () => {
    const retrieved = await resourceIndex.get("test-actor", null);
    assert.strictEqual(retrieved.length, 0);
    assert.ok(Array.isArray(retrieved));
  });

  test("returns empty array when passed undefined identifiers", async () => {
    const retrieved = await resourceIndex.get("test-actor", undefined);
    assert.strictEqual(retrieved.length, 0);
    assert.ok(Array.isArray(retrieved));
  });

  test("finds all resource identifiers", async () => {
    // Put some test resources
    const message1 = new common.Message({
      role: "system",
      content: { text: "First test message" },
    });

    await resourceIndex.put(message1);

    // Find all identifiers
    const identifiers = await resourceIndex.findAll();

    assert.strictEqual(identifiers.length, 1);
    assert.ok(identifiers[0] instanceof resource.Identifier);
    assert.strictEqual(identifiers[0].type, "common.Message");
  });

  test("finds resource identifiers by prefix", async () => {
    // Put some test resources
    const message1 = new common.Message({
      role: "system",
      content: { text: "First test message" },
    });

    await resourceIndex.put(message1);

    // Use a full URI prefix that should match
    const identifiers = await resourceIndex.findByPrefix("common.Message");

    assert.ok(identifiers.length >= 1);
    assert.ok(identifiers[0] instanceof resource.Identifier);
    assert.strictEqual(identifiers[0].type, "common.Message");
  });
});

describe("ResourceProcessor", () => {
  let resourceIndex;
  let knowledgeStorage;
  let llm;
  let logger;
  let processor;

  beforeEach(() => {
    resourceIndex = {
      put: async (_resource) => {},
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
                content: JSON.stringify([
                  {
                    purpose:
                      "Provide information about articles and their content",
                    applicability: "Use when displaying article metadata",
                    evaluation:
                      "Article displays correctly with proper metadata",
                  },
                ]),
              },
            },
          ],
        };
      },
    };

    processor = new ResourceProcessor(
      resourceIndex,
      knowledgeStorage,
      llm,
      logger,
    );
  });

  test("creates ResourceProcessor instance", () => {
    assert.ok(processor instanceof ResourceProcessor);
  });

  test("processes HTML files into resource contents", async () => {
    // Track calls to put
    let capturedMessage;
    let putCallCount = 0;

    // Override the put method to capture the resource
    resourceIndex.put = async (resource) => {
      putCallCount++;
      capturedMessage = resource;
    };

    await processor.process(".html", []);

    assert.strictEqual(
      putCallCount,
      1,
      "put() should have been called exactly once",
    );
    assert.ok(capturedMessage instanceof common.Message);
    assert.ok(capturedMessage.id instanceof resource.Identifier);
    assert.ok(capturedMessage.content instanceof resource.Content);
    assert.strictEqual(capturedMessage.id.type, "common.Message");
    assert.strictEqual(capturedMessage.role, "system");
    assert.ok(capturedMessage.content.jsonld);

    const jsonld = JSON.parse(String(capturedMessage.content));
    assert.strictEqual(jsonld["@type"], "Article");
    assert.strictEqual(jsonld["@context"], "http://schema.org/");
    assert.strictEqual(jsonld.headline, "Test Article");
  });

  test("sets subject from JSON-LD @id when present", async () => {
    // Update mock to return HTML with @id
    knowledgeStorage.get = async (key) => {
      if (key === "test.html") {
        return '<div itemscope itemtype="http://schema.org/Person" itemid="#alice"><h1 itemprop="name">Alice Smith</h1></div>';
      }
      return "";
    };

    let capturedMessage;
    resourceIndex.put = async (resource) => {
      capturedMessage = resource;
    };

    await processor.process(".html", []);

    assert.ok(capturedMessage instanceof common.Message);
    assert.ok(capturedMessage.id instanceof resource.Identifier);

    const jsonld = JSON.parse(String(capturedMessage.content));
    assert.strictEqual(jsonld["@id"], "#alice");
    assert.strictEqual(capturedMessage.id.subject, "#alice");
  });

  test("leaves subject empty when JSON-LD has no @id", async () => {
    // Default mock returns HTML without @id
    let capturedMessage;
    resourceIndex.put = async (resource) => {
      capturedMessage = resource;
    };

    await processor.process(".html", []);

    assert.ok(capturedMessage instanceof common.Message);
    assert.ok(capturedMessage.id instanceof resource.Identifier);

    const jsonld = JSON.parse(String(capturedMessage.content));
    assert.strictEqual(jsonld["@id"], undefined);
    assert.strictEqual(capturedMessage.id.subject, "");
  });

  test("handles empty HTML file list", async () => {
    knowledgeStorage.findByExtension = async () => [];

    // Should not throw any errors
    await processor.process(".html", []);
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
      knowledgeStorage,
      llmWithInvalidResponse,
      logger,
    );

    let putCallCount = 0;
    resourceIndex.put = async (_resource) => {
      putCallCount++;
    };

    // Should not throw an error, but should skip the problematic items
    await processorWithBrokenLlm.process(".html", []);

    // Verify that no resources were put because of parsing failures
    assert.strictEqual(putCallCount, 0);
  });
});

describe("toIdentifier helper function", () => {
  test("toIdentifier correctly creates Identifier from resource URI", () => {
    const uri = "common.Message.abc123";
    const identifier = toIdentifier(uri);

    assert.ok(identifier instanceof resource.Identifier);
    assert.strictEqual(identifier.type, "common.Message");
    assert.strictEqual(identifier.name, "abc123");
    assert.strictEqual(identifier.parent, "");
  });

  test("toIdentifier correctly handles URI with parent path", () => {
    const uri = "parent/child/common.Message.abc123";
    const identifier = toIdentifier(uri);

    assert.ok(identifier instanceof resource.Identifier);
    assert.strictEqual(identifier.type, "common.Message");
    assert.strictEqual(identifier.name, "abc123");
    assert.strictEqual(identifier.parent, "parent/child");
  });

  test("toIdentifier is reverse of Identifier.toString() - simple case", () => {
    const original = new resource.Identifier({
      type: "common.Message",
      name: "abc123",
      parent: "",
    });

    const uri = original.toString();
    const reconstructed = toIdentifier(uri);

    assert.strictEqual(reconstructed.type, original.type);
    assert.strictEqual(reconstructed.name, original.name);
    assert.strictEqual(reconstructed.parent, original.parent);
  });

  test("toIdentifier is reverse of Identifier.toString() - with parent", () => {
    const original = new resource.Identifier({
      type: "common.Message",
      name: "abc123",
      parent: "parent.Resource.def456",
    });

    const uri = original.toString();
    const reconstructed = toIdentifier(uri);

    assert.strictEqual(reconstructed.type, original.type);
    assert.strictEqual(reconstructed.name, original.name);
    assert.strictEqual(reconstructed.parent, original.parent);
  });
});

describe("toType helper function", () => {
  test("toType correctly creates type based on identifier", () => {
    const object = {
      id: {
        type: "common.Message",
      },
      role: "user",
      content: { text: "Hello, world!" },
    };

    const message = toType(object);
    assert.ok(message instanceof common.Message);
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
