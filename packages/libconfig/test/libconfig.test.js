/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Module under test
import { Config, ServiceConfig, ExtensionConfig } from "../index.js";

describe("libconfig", () => {
  describe("Config", () => {
    let mockFs;
    let mockProcess;
    let mockDotenv;

    beforeEach(() => {
      mockFs = {
        existsSync: mock.fn(() => true),
        mkdirSync: mock.fn(),
        readFileSync: mock.fn(() => "test: value"),
      };

      mockProcess = {
        cwd: mock.fn(() => "/test/dir"),
        env: {
          TEST_VAR: "test-value",
        },
      };

      mockDotenv = mock.fn();
    });

    test("creates config with defaults", () => {
      const config = new Config(
        "test",
        "myservice",
        { defaultValue: 42 },
        mockFs,
        mockProcess,
        mockDotenv,
      );

      assert.strictEqual(config.name, "myservice");
      assert.strictEqual(config.namespace, "test");
      assert.strictEqual(config.defaultValue, 42);
      assert.strictEqual(config.host, "0.0.0.0");
      assert.strictEqual(config.port, 3000);
    });

    test("loads environment variables", () => {
      mockProcess.env = {
        TEST_MYSERVICE_HOST: "custom-host",
        TEST_MYSERVICE_PORT: "8080",
      };

      const config = new Config(
        "test",
        "myservice",
        {},
        mockFs,
        mockProcess,
        mockDotenv,
      );

      assert.strictEqual(config.host, "custom-host");
      assert.strictEqual(config.port, 8080); // YAML parsing converts "8080" to number
    });

    test("parses YAML environment variables", () => {
      mockProcess.env = {
        TEST_MYSERVICE_NUMBERS: "[1, 2, 3]",
        TEST_MYSERVICE_BOOLEAN: "true",
      };

      const config = new Config(
        "test",
        "myservice",
        { numbers: [], boolean: false }, // Need defaults for the properties to exist
        mockFs,
        mockProcess,
        mockDotenv,
      );

      assert.deepStrictEqual(config.numbers, [1, 2, 3]);
      assert.strictEqual(config.boolean, true);
    });

    test("falls back to string for invalid YAML", () => {
      mockProcess.env = {
        TEST_MYSERVICE_INVALID: "not-yaml-[",
      };

      const config = new Config(
        "test",
        "myservice",
        { invalid: "" }, // Need default for the property to exist
        mockFs,
        mockProcess,
        mockDotenv,
      );

      assert.strictEqual(config.invalid, "not-yaml-[");
    });

    test("calls dotenv to load .env file", () => {
      new Config("test", "myservice", {}, mockFs, mockProcess, mockDotenv);

      assert.strictEqual(mockDotenv.mock.callCount(), 1);
    });

    test("handles missing .env file gracefully", () => {
      mockFs.existsSync = mock.fn(() => false);

      const config = new Config(
        "test",
        "myservice",
        {},
        mockFs,
        mockProcess,
        mockDotenv,
      );

      assert.strictEqual(config.name, "myservice");
    });
  });

  describe("Config methods", () => {
    let config;
    let mockFs;
    let mockProcess;

    beforeEach(() => {
      mockFs = {
        existsSync: mock.fn(() => true),
        mkdirSync: mock.fn(),
        readFileSync: mock.fn(() => "test-content"),
      };

      mockProcess = {
        cwd: mock.fn(() => "/test/dir"),
        env: {
          GITHUB_TOKEN: "gh-token-123",
          GITHUB_CLIENT_ID: "client-id-123",
        },
      };

      config = new Config("test", "myservice", {}, mockFs, mockProcess);
    });

    test("dataPath creates directory if missing", () => {
      mockFs.existsSync = mock.fn(() => false);

      const path = config.dataPath("subdir");

      assert.strictEqual(mockFs.mkdirSync.mock.callCount(), 1);
      assert(path.includes("data/subdir"));
    });

    test("dataPath returns existing path", () => {
      const path = config.dataPath("subdir");

      assert.strictEqual(mockFs.mkdirSync.mock.callCount(), 0);
      assert(path.includes("data/subdir"));
    });

    test("storagePath creates directory if missing", () => {
      mockFs.existsSync = mock.fn(() => false);

      const path = config.storagePath("subdir");

      assert.strictEqual(mockFs.mkdirSync.mock.callCount(), 1);
      assert(path.includes("data/storage/subdir"));
    });

    test("storagePath returns existing path", () => {
      const path = config.storagePath("subdir");

      assert.strictEqual(mockFs.mkdirSync.mock.callCount(), 0);
      assert(path.includes("data/storage/subdir"));
    });

    test("githubToken returns from environment", () => {
      const token = config.githubToken();

      assert.strictEqual(token, "gh-token-123");
    });

    test("githubToken reads from file when env not set", () => {
      mockProcess.env = {};
      mockFs.readFileSync = mock.fn(() => "file-token-456\n");

      const token = config.githubToken();

      assert.strictEqual(token, "file-token-456");
      assert.strictEqual(mockFs.readFileSync.mock.callCount(), 1);
    });

    test("githubClientId returns from environment", () => {
      const clientId = config.githubClientId();

      assert.strictEqual(clientId, "client-id-123");
    });

    test("publicPath returns path", () => {
      const path = config.publicPath("styles.css");

      assert(path.includes("public/styles.css"));
    });

    test("protoFile returns proto path", () => {
      const path = config.protoFile("myservice");

      assert(path.includes("proto/myservice.proto"));
    });

    test("reset clears cached values", () => {
      // Access githubToken to cache it
      config.githubToken();

      config.reset();

      // Should reload from environment
      mockProcess.env.GITHUB_TOKEN = "new-token";
      const token = config.githubToken();

      assert.strictEqual(token, "new-token");
    });
  });

  describe("ServiceConfig", () => {
    test("creates service config", () => {
      const config = new ServiceConfig("testservice", { custom: "value" });

      assert.strictEqual(config.name, "testservice");
      assert.strictEqual(config.namespace, "service");
      assert.strictEqual(config.custom, "value");
    });
  });

  describe("ExtensionConfig", () => {
    test("creates extension config", () => {
      const config = new ExtensionConfig("testextension", { custom: "value" });

      assert.strictEqual(config.name, "testextension");
      assert.strictEqual(config.namespace, "extension");
      assert.strictEqual(config.custom, "value");
    });
  });
});
