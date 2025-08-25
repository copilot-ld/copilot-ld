/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { toType, ResourceIndex, ResourceProcessor } from "../index.js";
import { common } from "@copilot-ld/libtype";

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

  test("puts resource with metadata generation", async () => {
    const resource = new common.MessageV2({
      role: "system",
      content: "Test message content",
    });

    await resourceIndex.put(resource);

    // Verify metadata was generated
    assert.ok(resource.meta);
    assert.ok(resource.meta.id);
    assert.strictEqual(resource.meta.type, "common.MessageV2");
  });

  test("gets resources by IDs with access control", async () => {
    // First, put a resource
    const resource = new common.MessageV2({
      role: "system",
      content: "Test message for retrieval",
    });

    await resourceIndex.put(resource);
    const resourceId = resource.meta.id;

    // Then get it back
    const retrieved = await resourceIndex.get("test-actor", [resourceId]);

    assert.strictEqual(retrieved.length, 1);
    assert.strictEqual(retrieved[0].role, "system");
    assert.strictEqual(retrieved[0].content, "Test message for retrieval");
    assert.ok(retrieved[0].meta);
    assert.strictEqual(retrieved[0].meta.type, "common.MessageV2");
  });
});

describe("ResourceProcessor", () => {
  let resourceIndex;
  let knowledgeStorage;
  let logger;
  let processor;

  beforeEach(() => {
    resourceIndex = {
      put: async (_resource) => {
        // Mock implementation
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

    processor = new ResourceProcessor(resourceIndex, knowledgeStorage, logger);
  });

  test("creates ResourceProcessor instance", () => {
    assert.ok(processor instanceof ResourceProcessor);
  });

  test("processes HTML files into resources", async () => {
    // Start with an empty message
    let message;

    // Capture the resource on the mock
    resourceIndex.put = async (resource) => {
      message = resource;
    };

    await processor.process(".html", []);

    assert.ok(message instanceof common.MessageV2);
    assert.ok(message.meta instanceof common.Resource);
    assert.strictEqual(message.meta.type, "common.MessageV2");
    assert.strictEqual(message.role, "system");
    assert.ok(message.content);

    const jsonld = JSON.parse(message.content);
    assert.strictEqual(jsonld["@type"], "Article");
    assert.strictEqual(jsonld["@context"], "http://schema.org/");
    assert.strictEqual(jsonld.headline, "Test Article");
  });

  test("handles empty HTML file list", async () => {
    knowledgeStorage.find = async () => [];

    // Should not throw any errors
    await processor.process(".html", []);
  });
});

describe("toType helper function", () => {
  test("toType correctly creates type based on meta.id", () => {
    const object = {
      meta: {
        id: "cld:common.MessageV2.hash0001",
      },
      role: "user",
      content: "Hello, world!",
    };

    const resource = toType(object);
    assert.ok(resource instanceof common.MessageV2);
    assert.ok(resource.meta instanceof common.Resource);
  });

  test("toType correctly creates type based on meta.type", () => {
    const object = {
      meta: {
        type: "common.MessageV2",
      },
      role: "user",
      content: "Hello, world!",
    };

    const resource = toType(object);
    assert.ok(resource instanceof common.MessageV2);
    assert.ok(resource.meta instanceof common.Resource);
  });

  test("toType ignores meta.type if meta.id exists", () => {
    const object = {
      meta: {
        id: "cld:common.MessageV2.hash0001",
        type: "invalid.Type",
      },
      role: "user",
      content: "Hello, world!",
    };

    const resource = toType(object);
    assert.ok(resource instanceof common.MessageV2);
    assert.strictEqual(resource.meta.type, "common.MessageV2");
    assert.ok(resource.meta instanceof common.Resource);
  });
});
