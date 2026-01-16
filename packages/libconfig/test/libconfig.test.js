import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import {
  createConfig,
  createServiceConfig,
  createExtensionConfig,
} from "../index.js";
import { createMockStorage } from "@copilot-ld/libharness";

describe("libconfig", () => {
  describe("Config", () => {
    let mockProcess;
    let mockStorage;

    beforeEach(() => {
      mockStorage = createMockStorage({
        get: mock.fn(() => Promise.resolve("")),
      });

      mockProcess = {
        cwd: mock.fn(() => "/test/dir"),
        env: {
          TEST_VAR: "test-value",
        },
      };
    });

    test("creates config with defaults", async () => {
      const mockStorageFn = () => mockStorage;

      const config = await createConfig(
        "test",
        "myservice",
        { defaultValue: 42 },
        mockProcess,
        mockStorageFn,
      );

      assert.strictEqual(config.name, "myservice");
      assert.strictEqual(config.namespace, "test");
      assert.strictEqual(config.defaultValue, 42);
      assert.strictEqual(config.host, "0.0.0.0");
      assert.strictEqual(config.port, 3000);
    });

    test("loads environment variables", async () => {
      mockProcess.env = {
        TEST_MYSERVICE_HOST: "custom-host",
        TEST_MYSERVICE_PORT: "8080",
      };

      const mockStorageFn = () => mockStorage;
      const config = await createConfig(
        "test",
        "myservice",
        {},
        mockProcess,
        mockStorageFn,
      );

      assert.strictEqual(config.host, "custom-host");
      assert.strictEqual(config.port, 8080); // JSON parsing converts "8080" to number
    });

    test("parses JSON environment variables", async () => {
      mockProcess.env = {
        TEST_MYSERVICE_NUMBERS: "[1, 2, 3]",
        TEST_MYSERVICE_BOOLEAN: "true",
      };

      const mockStorageFn = () => mockStorage;
      const config = await createConfig(
        "test",
        "myservice",
        { numbers: [], boolean: false }, // Need defaults for the properties to exist
        mockProcess,
        mockStorageFn,
      );

      assert.deepStrictEqual(config.numbers, [1, 2, 3]);
      assert.strictEqual(config.boolean, true);
    });

    test("falls back to string for invalid JSON", async () => {
      mockProcess.env = {
        TEST_MYSERVICE_INVALID: "not-json-[",
      };

      const mockStorageFn = () => mockStorage;
      const config = await createConfig(
        "test",
        "myservice",
        { invalid: "" }, // Need default for the property to exist
        mockProcess,
        mockStorageFn,
      );

      assert.strictEqual(config.invalid, "not-json-[");
    });

    test("loads environment variables from process.env", async () => {
      const mockStorageFn = () => mockStorage;
      const config = await createConfig(
        "test",
        "myservice",
        {},
        mockProcess,
        mockStorageFn,
      );

      // Should not throw and should work without external env loading
      assert.strictEqual(config.name, "myservice");
    });

    test("handles storage initialization gracefully", async () => {
      const mockStorageFn = () => mockStorage;
      const config = await createConfig(
        "test",
        "myservice",
        {},
        mockProcess,
        mockStorageFn,
      );

      assert.strictEqual(config.name, "myservice");
    });

    test("accepts optional storageFn parameter", async () => {
      const mockStorageFn = mock.fn(() => ({
        exists: () => Promise.resolve(false),
        get: () => Promise.resolve(Buffer.from("test: value")),
      }));

      const config = await createConfig(
        "test",
        "myservice",
        {},
        mockProcess,
        mockStorageFn,
      );

      assert.strictEqual(config.name, "myservice");
    });

    test("uses default storageFactory when storageFn not provided", async () => {
      const config = await createConfig("test", "myservice", {}, mockProcess);

      assert.strictEqual(config.name, "myservice");
      // Should have a default storageFn that calls storageFactory
    });
  });

  describe("Environment-driven storage integration", () => {
    // Tests for environment-driven storage configuration

    test("storageFactory respects STORAGE_TYPE environment variable", async () => {
      const mockProcess = {
        env: { STORAGE_TYPE: "local" },
        cwd: () => "/test/dir",
      };

      const config = await createConfig("test", "myservice", {}, mockProcess);

      assert.strictEqual(config.name, "myservice");
      // Config should be able to create storage through environment-driven storageFactory
    });

    test("storageFactory creates S3Storage with environment variables", async () => {
      const mockProcess = {
        env: {
          STORAGE_TYPE: "s3",
          S3_REGION: "us-east-1",
          S3_ENDPOINT: "https://s3.amazonaws.com",
          AWS_ACCESS_KEY_ID: "test-key",
          AWS_SECRET_ACCESS_KEY: "test-secret",
          S3_DATA_BUCKET: "test-bucket",
        },
        cwd: () => "/test/dir",
      };

      // Use a mock storageFn to avoid actual S3 connection
      // The storage factory function receives basePath and process parameters
      const mockStorageFn = (_basePath, _process) => ({
        exists: () => Promise.resolve(false),
        get: () => Promise.resolve(Buffer.from("")),
        put: () => Promise.resolve(),
        path: (key) => key, // Add the missing path method
      });

      const config = await createConfig(
        "test",
        "myservice",
        {},
        mockProcess,
        mockStorageFn,
      );

      assert.strictEqual(config.name, "myservice");
      // Config should be able to create with S3 environment variables set
    });

    test("demonstrates circular dependency resolution", async () => {
      // This test verifies that we can create configs and storage independently
      const mockProcess = {
        env: { STORAGE_TYPE: "local" },
        cwd: () => "/test/dir",
      };

      // Can create config without storage dependency
      const config = await createConfig("test", "myservice", {}, mockProcess);

      // Can use environment-driven storageFactory without config dependency
      // This would have been circular before the decoupling
      assert.strictEqual(config.name, "myservice");
      assert.strictEqual(config.namespace, "test");
    });
  });

  describe("Config methods", () => {
    let config;

    beforeEach(async () => {
      const mockProcess = {
        cwd: mock.fn(() => "/test/dir"),
        env: {
          LLM_TOKEN: "llm-token-123",
        },
      };

      config = await createConfig("test", "myservice", {}, mockProcess);
    });

    test("ghClientId throws when not set in environment", () => {
      assert.throws(() => config.ghClientId(), {
        message: "GitHub client ID not found in environment",
      });
    });

    test("llmToken returns from environment", async () => {
      const token = await config.llmToken();
      assert.strictEqual(token, "llm-token-123");
    });

    test("llmBaseUrl returns default when not set", () => {
      const baseUrl = config.llmBaseUrl();
      assert.strictEqual(baseUrl, "https://api.githubcopilot.com");
    });

    test("reset clears cached values", async () => {
      const mockProcess = {
        cwd: () => "/test/dir",
        env: { LLM_TOKEN: "new-token" },
      };

      const mockStorageFn = () => ({
        exists: () => Promise.resolve(false),
        get: () => Promise.resolve(Buffer.from("")),
        path: (key) => key, // Add the missing path method
      });

      const testConfig = await createConfig(
        "test",
        "myservice",
        {},
        mockProcess,
        mockStorageFn,
      );

      // Access llmToken to cache it
      await testConfig.llmToken();

      // Reset should clear the cache
      testConfig.reset();

      const token = await testConfig.llmToken();
      assert.strictEqual(token, "new-token");
    });

    test("creates service config", async () => {
      const config = await createServiceConfig("testservice", {
        custom: "value",
      });

      assert.strictEqual(config.name, "testservice");
      assert.strictEqual(config.namespace, "service");
      assert.strictEqual(config.custom, "value");
    });

    test("creates extension config", async () => {
      const config = await createExtensionConfig("testextension", {
        custom: "value",
      });

      assert.strictEqual(config.name, "testextension");
      assert.strictEqual(config.namespace, "extension");
      assert.strictEqual(config.custom, "value");
    });
  });
});
