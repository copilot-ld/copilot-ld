/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { Policy, PolicyInterface } from "../index.js";

// Mock imports
import { StorageInterface } from "@copilot-ld/libstorage";

describe("libpolicy", () => {
  describe("PolicyInterface", () => {
    test("throws error for load method", async () => {
      const policyInterface = new PolicyInterface();

      await assert.rejects(() => policyInterface.load(), {
        message: "Not implemented",
      });
    });

    test("throws error for evaluate method", async () => {
      const policyInterface = new PolicyInterface();

      await assert.rejects(() => policyInterface.evaluate({}), {
        message: "Not implemented",
      });
    });
  });

  describe("Policy", () => {
    let mockStorage;
    let policy;

    beforeEach(() => {
      mockStorage = {
        put: mock.fn(() => Promise.resolve()),
        get: mock.fn(() => Promise.resolve(Buffer.from("test data"))),
        delete: mock.fn(() => Promise.resolve()),
        exists: mock.fn(() => Promise.resolve(true)),
        findByExtension: mock.fn(() => Promise.resolve([])),
        getMany: mock.fn(() => Promise.resolve({})),
        findByPrefix: mock.fn(() => Promise.resolve([])),
        list: mock.fn(() => Promise.resolve([])),
        path: mock.fn((key) => `/test/base/${key}`),
        ensureBucket: mock.fn(() => Promise.resolve(false)),
        bucketExists: mock.fn(() => Promise.resolve(true)),
      };

      // Make mockStorage extend StorageInterface for instanceof check
      Object.setPrototypeOf(mockStorage, StorageInterface.prototype);

      policy = new Policy(mockStorage);
    });

    test("creates Policy with storage instance", () => {
      assert.ok(policy instanceof Policy);
      assert.ok(policy instanceof PolicyInterface);
    });

    test("throws error when storage is null", () => {
      assert.throws(() => new Policy(null), {
        message: "storage is required",
      });
    });

    test("throws error when storage is undefined", () => {
      assert.throws(() => new Policy(undefined), {
        message: "storage is required",
      });
    });

    test("throws error when storage is not StorageInterface instance", () => {
      assert.throws(() => new Policy({}), {
        message: "storage must be a StorageInterface instance",
      });
    });

    test("load method completes successfully", async () => {
      await policy.load();

      // Verify that bucketExists was called
      assert.strictEqual(mockStorage.bucketExists.mock.callCount(), 1);
    });

    test("evaluate returns true for valid input", async () => {
      const input = {
        actor: "cld:common.Assistant.hash0000",
        resources: [
          "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        ],
      };

      const result = await policy.evaluate(input);

      assert.strictEqual(result, true);
    });

    test("evaluate processes actor information correctly", async () => {
      const input = {
        actor: "cld:common.Assistant.hash0000",
        resources: [
          "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        ],
      };

      const result = await policy.evaluate(input);

      assert.strictEqual(result, true);
    });

    test("evaluate throws error when input is null", async () => {
      await assert.rejects(() => policy.evaluate(null), {
        message: "input is required",
      });
    });

    test("evaluate throws error when input is undefined", async () => {
      await assert.rejects(() => policy.evaluate(undefined), {
        message: "input is required",
      });
    });

    test("evaluate throws error when actor is missing", async () => {
      const input = {
        resources: [
          "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        ],
      };

      await assert.rejects(() => policy.evaluate(input), {
        message: "input.actor must be a non-empty string",
      });
    });

    test("evaluate throws error when actor is empty string", async () => {
      const input = {
        actor: "",
        resources: [
          "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        ],
      };

      await assert.rejects(() => policy.evaluate(input), {
        message: "input.actor must be a non-empty string",
      });
    });

    test("evaluate throws error when actor is not string", async () => {
      const input = {
        actor: 123,
        resources: [
          "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        ],
      };

      await assert.rejects(() => policy.evaluate(input), {
        message: "input.actor must be a non-empty string",
      });
    });

    test("evaluate throws error when resources is missing", async () => {
      const input = {
        actor: "cld:common.Assistant.hash0000",
      };

      await assert.rejects(() => policy.evaluate(input), {
        message: "input.resources must be an array",
      });
    });

    test("evaluate throws error when resources is not array", async () => {
      const input = {
        actor: "cld:common.Assistant.hash0000",
        resources: "not-an-array",
      };

      await assert.rejects(() => policy.evaluate(input), {
        message: "input.resources must be an array",
      });
    });

    test("evaluate handles empty resources array", async () => {
      const input = {
        actor: "cld:common.Assistant.hash0000",
        resources: [],
      };

      const result = await policy.evaluate(input);

      assert.strictEqual(result, true);
    });

    test("evaluate handles multiple resources", async () => {
      const input = {
        actor: "cld:common.Assistant.hash0000",
        resources: [
          "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
          "cld:common.Conversation.hash0001/common.MessageV2.hash0003",
        ],
      };

      const result = await policy.evaluate(input);

      assert.strictEqual(result, true);
    });
  });

  describe("Integration Examples", () => {
    test("demonstrates TODO.md example usage", async () => {
      // Mock storage factory similar to the TODO.md example
      const mockStorage = {
        put: mock.fn(() => Promise.resolve()),
        get: mock.fn(() => Promise.resolve(Buffer.from("test data"))),
        delete: mock.fn(() => Promise.resolve()),
        exists: mock.fn(() => Promise.resolve(true)),
        findByExtension: mock.fn(() => Promise.resolve([])),
        getMany: mock.fn(() => Promise.resolve({})),
        findByPrefix: mock.fn(() => Promise.resolve([])),
        list: mock.fn(() => Promise.resolve([])),
        path: mock.fn((key) => `/test/base/${key}`),
        ensureBucket: mock.fn(() => Promise.resolve(false)),
        bucketExists: mock.fn(() => Promise.resolve(true)),
      };
      Object.setPrototypeOf(mockStorage, StorageInterface.prototype);

      // Mock storageFactory to return our mock storage
      const mockStorageFactory = mock.fn(() => mockStorage);

      // Example usage from TODO.md
      const storage = mockStorageFactory("policies");
      const policy = new Policy(storage);
      await policy.load();

      // Example assistant (simplified since common.Assistant may not exist yet)
      const assistant = {
        meta: {
          name: "data-expert",
          uri: "cld:common.Assistant.hash0000",
        },
      };

      // Example evaluation
      const allowed = await policy.evaluate({
        actor: assistant.meta.uri,
        resources: [
          "cld:common.Conversation.hash0001/common.MessageV2.hash0002",
        ],
      });

      // Verify the expected behavior
      assert.strictEqual(allowed, true); // Always true for now
      assert.strictEqual(mockStorageFactory.mock.callCount(), 1);
      assert.deepStrictEqual(mockStorageFactory.mock.calls[0].arguments, [
        "policies",
      ]);
    });
  });
});
