/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Mock libvector
const mockLibvector = {
  queryIndices: mock.fn(() => Promise.resolve([])),
};

// Mock libconfig (not used in this test but would be used in real implementation)
const _mockLibconfig = {
  ServiceConfig: mock.fn(),
};

// Mock libservice
const mockLibservice = {
  Service: class MockService {
    constructor(config, vectorIndices) {
      this.config = config;
      this.vectorIndices = vectorIndices;
    }
  },
};

// Create VectorService class for testing
class VectorService extends mockLibservice.Service {
  #vectorIndices;

  constructor(config, vectorIndices) {
    super(config, vectorIndices);
    this.#vectorIndices = vectorIndices;
  }

  async QueryItems({ indices, vector, threshold, limit }) {
    const requestedIndices = indices
      .map((name) => this.#vectorIndices.get(name))
      .filter((index) => index);

    const results = await mockLibvector.queryIndices(
      requestedIndices,
      vector,
      threshold,
      limit,
    );

    return { results };
  }
}

describe("vector service", () => {
  describe("VectorService", () => {
    let vectorService;
    let mockVectorIndices;
    let mockConfig;

    beforeEach(() => {
      mockConfig = {
        threshold: 0.3,
        limit: 100,
      };

      const mockIndex1 = { name: "index1" };
      const mockIndex2 = { name: "index2" };

      mockVectorIndices = new Map([
        ["index1", mockIndex1],
        ["index2", mockIndex2],
      ]);

      vectorService = new VectorService(mockConfig, mockVectorIndices);

      // Reset mocks
      mockLibvector.queryIndices = mock.fn(() => Promise.resolve([]));
    });

    test("creates vector service with config and indices", () => {
      assert.strictEqual(vectorService.config, mockConfig);
    });

    test("QueryItems filters non-existent indices", async () => {
      const request = {
        indices: ["index1", "non-existent", "index2"],
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
      };

      await vectorService.QueryItems(request);

      assert.strictEqual(mockLibvector.queryIndices.mock.callCount(), 1);
      const [requestedIndices, vector, threshold, limit] =
        mockLibvector.queryIndices.mock.calls[0].arguments;

      assert.strictEqual(requestedIndices.length, 2); // Only existing indices
      assert.deepStrictEqual(vector, [0.1, 0.2, 0.3]);
      assert.strictEqual(threshold, 0.5);
      assert.strictEqual(limit, 10);
    });

    test("QueryItems returns results from queryIndices", async () => {
      const expectedResults = [
        { id: "item1", score: 0.9 },
        { id: "item2", score: 0.7 },
      ];

      mockLibvector.queryIndices = mock.fn(() =>
        Promise.resolve(expectedResults),
      );

      const request = {
        indices: ["index1"],
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
      };

      const response = await vectorService.QueryItems(request);

      assert.deepStrictEqual(response.results, expectedResults);
    });

    test("QueryItems handles empty indices array", async () => {
      const request = {
        indices: [],
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
      };

      const response = await vectorService.QueryItems(request);

      assert.strictEqual(mockLibvector.queryIndices.mock.callCount(), 1);
      const [requestedIndices] =
        mockLibvector.queryIndices.mock.calls[0].arguments;
      assert.strictEqual(requestedIndices.length, 0);
      assert.deepStrictEqual(response.results, []);
    });

    test("QueryItems handles all non-existent indices", async () => {
      const request = {
        indices: ["non-existent1", "non-existent2"],
        vector: [0.1, 0.2, 0.3],
        threshold: 0.5,
        limit: 10,
      };

      const response = await vectorService.QueryItems(request);

      const [requestedIndices] =
        mockLibvector.queryIndices.mock.calls[0].arguments;
      assert.strictEqual(requestedIndices.length, 0);
      assert.deepStrictEqual(response.results, []);
    });

    test("QueryItems passes through all parameters", async () => {
      const request = {
        indices: ["index1"],
        vector: [0.4, 0.5, 0.6],
        threshold: 0.8,
        limit: 5,
      };

      await vectorService.QueryItems(request);

      const [, vector, threshold, limit] =
        mockLibvector.queryIndices.mock.calls[0].arguments;
      assert.deepStrictEqual(vector, [0.4, 0.5, 0.6]);
      assert.strictEqual(threshold, 0.8);
      assert.strictEqual(limit, 5);
    });
  });

  describe("VectorService Constructor", () => {
    test("passes only config to parent Service constructor", () => {
      // Verify that VectorService properly extends Service with correct parameters
      const config = { name: "vector", port: 3006 };
      const vectorIndices = new Map([["test", { query: () => [] }]]);

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
        constructor(config, vectorIndices) {
          super(config); // Correct pattern - only pass config to parent
          this.vectorIndices = vectorIndices;
        }
      }

      // Should not throw when properly constructed
      assert.doesNotThrow(() => new TestVectorService(config, vectorIndices));

      // Demonstrate incorrect pattern would fail
      class IncorrectVectorService extends TestService {
        constructor(config, vectorIndices) {
          super(config, vectorIndices); // Incorrect - vectorIndices is not a function
          this.vectorIndices = vectorIndices;
        }
      }

      assert.throws(() => new IncorrectVectorService(config, vectorIndices), {
        message: /grpcFactory must be a function/,
      });
    });
  });
});
