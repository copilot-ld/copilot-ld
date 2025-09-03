/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Mock vector indexes
const mockContentIndex = {
  queryItems: mock.fn(() => Promise.resolve([])),
  getItem: mock.fn(() => Promise.resolve(null)),
};

const mockDescriptorIndex = {
  queryItems: mock.fn(() => Promise.resolve([])),
  getItem: mock.fn(() => Promise.resolve(null)),
};

// Mock libservice
const mockLibservice = {
  Service: class MockService {
    constructor(config) {
      this.config = config;
    }
  },
};

// Create VectorService class for testing (mirrors implementation contract)
class VectorService extends mockLibservice.Service {
  #contentIndex;
  #descriptorIndex;

  constructor(config, contentIndex, descriptorIndex) {
    super(config);
    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
  }

  async QueryItems(req) {
    const indexType = req.index || "content";
    const targetIndex =
      indexType === "descriptor" ? this.#descriptorIndex : this.#contentIndex;

    const identifiers = await targetIndex.queryItems(
      req.vector,
      req.filter || {},
    );

    return { identifiers };
  }

  async GetItem(req) {
    const indexType = req.index || "content";
    const targetIndex =
      indexType === "descriptor" ? this.#descriptorIndex : this.#contentIndex;

    const identifier = await targetIndex.getItem(req.id);

    return { identifier };
  }
}

describe("vector service", () => {
  describe("VectorService", () => {
    let vectorService;
    let mockConfig;

    beforeEach(() => {
      mockConfig = {
        threshold: 0.3,
        limit: 100,
      };

      vectorService = new VectorService(
        mockConfig,
        mockContentIndex,
        mockDescriptorIndex,
      );

      // Reset mocks
      mockContentIndex.queryItems = mock.fn(() => Promise.resolve([]));
      mockDescriptorIndex.queryItems = mock.fn(() => Promise.resolve([]));
      mockContentIndex.getItem = mock.fn(() => Promise.resolve(null));
      mockDescriptorIndex.getItem = mock.fn(() => Promise.resolve(null));
    });

    test("creates vector service with config and indexes", () => {
      assert.strictEqual(vectorService.config, mockConfig);
    });

    test("QueryItems uses content index by default", async () => {
      const request = {
        vector: [0.1, 0.2, 0.3],
        filter: { threshold: 0.5, limit: 10 },
      };

      await vectorService.QueryItems(request);

      assert.strictEqual(mockContentIndex.queryItems.mock.callCount(), 1);
      assert.strictEqual(mockDescriptorIndex.queryItems.mock.callCount(), 0);

      const [vector, filter] =
        mockContentIndex.queryItems.mock.calls[0].arguments;
      assert.deepStrictEqual(vector, [0.1, 0.2, 0.3]);
      assert.strictEqual(filter.threshold, 0.5);
      assert.strictEqual(filter.limit, 10);
    });

    test("QueryItems uses content index when explicitly specified", async () => {
      const request = {
        vector: [0.1, 0.2, 0.3],
        filter: { threshold: 0.5, limit: 10 },
        index: "content",
      };

      await vectorService.QueryItems(request);

      assert.strictEqual(mockContentIndex.queryItems.mock.callCount(), 1);
      assert.strictEqual(mockDescriptorIndex.queryItems.mock.callCount(), 0);
    });

    test("QueryItems uses descriptor index when specified", async () => {
      const request = {
        vector: [0.1, 0.2, 0.3],
        filter: { threshold: 0.5, limit: 10 },
        index: "descriptor",
      };

      await vectorService.QueryItems(request);

      assert.strictEqual(mockContentIndex.queryItems.mock.callCount(), 0);
      assert.strictEqual(mockDescriptorIndex.queryItems.mock.callCount(), 1);

      const [vector, filter] =
        mockDescriptorIndex.queryItems.mock.calls[0].arguments;
      assert.deepStrictEqual(vector, [0.1, 0.2, 0.3]);
      assert.strictEqual(filter.threshold, 0.5);
      assert.strictEqual(filter.limit, 10);
    });

    test("QueryItems returns identifiers from index", async () => {
      const expectedIdentifiers = [
        { id: "item1", score: 0.9 },
        { id: "item2", score: 0.7 },
      ];

      mockContentIndex.queryItems = mock.fn(() =>
        Promise.resolve(expectedIdentifiers),
      );

      const request = {
        vector: [0.1, 0.2, 0.3],
        filter: { threshold: 0.5, limit: 10 },
      };

      const response = await vectorService.QueryItems(request);

      assert.deepStrictEqual(response.identifiers, expectedIdentifiers);
    });

    test("GetItem uses content index by default", async () => {
      const request = {
        id: "test-item-1",
      };

      await vectorService.GetItem(request);

      assert.strictEqual(mockContentIndex.getItem.mock.callCount(), 1);
      assert.strictEqual(mockDescriptorIndex.getItem.mock.callCount(), 0);

      const [id] = mockContentIndex.getItem.mock.calls[0].arguments;
      assert.strictEqual(id, "test-item-1");
    });

    test("GetItem uses content index when explicitly specified", async () => {
      const request = {
        index: "content",
        id: "test-item-1",
      };

      await vectorService.GetItem(request);

      assert.strictEqual(mockContentIndex.getItem.mock.callCount(), 1);
      assert.strictEqual(mockDescriptorIndex.getItem.mock.callCount(), 0);
    });

    test("GetItem uses descriptor index when specified", async () => {
      const request = {
        index: "descriptor",
        id: "test-item-1",
      };

      await vectorService.GetItem(request);

      assert.strictEqual(mockContentIndex.getItem.mock.callCount(), 0);
      assert.strictEqual(mockDescriptorIndex.getItem.mock.callCount(), 1);

      const [id] = mockDescriptorIndex.getItem.mock.calls[0].arguments;
      assert.strictEqual(id, "test-item-1");
    });

    test("GetItem returns identifier from index", async () => {
      const expectedIdentifier = {
        id: "test-item-1",
        type: "MessageV2",
        name: "MessageV2.test-item-1",
        tokens: 42,
      };

      mockContentIndex.getItem = mock.fn(() =>
        Promise.resolve(expectedIdentifier),
      );

      const request = {
        id: "test-item-1",
      };

      const response = await vectorService.GetItem(request);

      assert.deepStrictEqual(response.identifier, expectedIdentifier);
    });

    test("GetItem returns null when item not found", async () => {
      mockContentIndex.getItem = mock.fn(() => Promise.resolve(null));

      const request = {
        id: "non-existent-item",
      };

      const response = await vectorService.GetItem(request);

      assert.strictEqual(response.identifier, null);
    });
  });

  describe("VectorService Constructor", () => {
    test("passes only config to parent Service constructor", () => {
      const config = { name: "vector", port: 3006 };

      // Mock the real Service class behavior to validate constructor calls
      class TestService {
        constructor(config, grpcFactory, authFactory) {
          if (grpcFactory && typeof grpcFactory !== "function") {
            throw new Error("grpcFactory must be a function");
          }
          if (authFactory && typeof authFactory !== "function") {
            throw new Error("authFactory must be a function");
          }
          this.config = config;
        }
      }

      class TestVectorService extends TestService {
        constructor(config, contentIndex, descriptorIndex) {
          super(config); // Correct pattern - only pass config to parent
          this.contentIndex = contentIndex;
          this.descriptorIndex = descriptorIndex;
        }
      }

      // Should not throw when properly constructed
      assert.doesNotThrow(
        () =>
          new TestVectorService(config, mockContentIndex, mockDescriptorIndex),
      );

      // Demonstrate incorrect pattern would fail
      class IncorrectVectorService extends TestService {
        constructor(config, contentIndex, descriptorIndex) {
          super(config, contentIndex); // Incorrect - contentIndex is not a function
          this.contentIndex = contentIndex;
          this.descriptorIndex = descriptorIndex;
        }
      }

      assert.throws(
        () =>
          new IncorrectVectorService(
            config,
            mockContentIndex,
            mockDescriptorIndex,
          ),
        {
          message: /grpcFactory must be a function/,
        },
      );
    });
  });
});
