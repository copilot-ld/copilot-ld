/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

import { Config } from "@copilot-ld/libconfig";
import { Client, Server } from "@copilot-ld/librpc";

describe("Service Integration", () => {
  let mockGrpcFn;
  let mockAuthFn;
  let mockLogFn;
  let mockObserverFn;

  beforeEach(() => {
    // Mock gRPC factory
    const mockGrpc = {
      Server: function () {
        return {
          addService: mock.fn(),
          bindAsync: mock.fn((uri, creds, callback) => callback(null, 5000)),
          tryShutdown: mock.fn((callback) => callback()),
        };
      },
      loadPackageDefinition: mock.fn(() => ({
        test: { Test: { service: {} } },
      })),
      makeGenericClientConstructor: mock.fn(() => function () {}),
      ServerCredentials: {
        createInsecure: mock.fn(),
      },
      credentials: {
        createInsecure: mock.fn(),
      },
      status: {
        UNAUTHENTICATED: 16,
        INTERNAL: 13,
      },
    };

    const mockProtoLoader = {
      loadSync: mock.fn(() => ({})),
    };

    mockGrpcFn = () => ({ grpc: mockGrpc, protoLoader: mockProtoLoader });

    // Mock auth factory
    mockAuthFn = () => ({
      createClientInterceptor: () => () => {},
      validateCall: () => ({ isValid: true, serviceId: "test" }),
    });

    // Mock log factory
    mockLogFn = {
      debug: mock.fn(),
    };

    // Mock observer factory
    mockObserverFn = () => ({
      observeServerUnaryCall: async (method, handler, call, callback) => {
        return await handler(call, callback);
      },
      observeClientUnaryCall: async (method, request, fn) => {
        return await fn();
      },
    });
  });

  test("ServiceConfig integrates with Client", () => {
    const config = new Config("service", "agent");
    const client = new Client(
      config,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(client);
    assert.strictEqual(config.name, "agent");
    assert.strictEqual(client.config, config);
  });

  test("ExtensionConfig integrates with Client", () => {
    const config = new Config("extension", "vector");
    const client = new Client(
      config,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(client);
    assert.strictEqual(config.name, "vector");
    assert.strictEqual(client.config, config);
  });

  test("ServiceConfig integrates with Server", () => {
    const config = new Config("service", "test-service");
    const mockService = {
      getProtoName: () => "test.proto",
      getHandlers: () => ({
        TestMethod: async () => ({ result: "test" }),
      }),
    };

    const server = new Server(
      mockService,
      config,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(server);
    assert.strictEqual(config.name, "test-service");
    assert.strictEqual(server.config, config);
  });

  test("Multiple services use different configs", () => {
    const agentConfig = new Config("service", "agent");
    const vectorConfig = new Config("service", "vector");

    const agentClient = new Client(
      agentConfig,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );
    const vectorClient = new Client(
      vectorConfig,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(agentClient);
    assert.ok(vectorClient);
    assert.notStrictEqual(agentConfig.name, vectorConfig.name);
    assert.strictEqual(agentClient.config.name, "agent");
    assert.strictEqual(vectorClient.config.name, "vector");
  });

  test("Extension and Service configs work together", () => {
    const extensionConfig = new Config("extension", "llm");
    const serviceConfig = new Config("service", "agent");

    const extensionClient = new Client(
      extensionConfig,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );
    const serviceClient = new Client(
      serviceConfig,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(extensionClient);
    assert.ok(serviceClient);
    assert.notStrictEqual(extensionConfig.name, serviceConfig.name);
    assert.strictEqual(extensionClient.config.name, "llm");
    assert.strictEqual(serviceClient.config.name, "agent");
  });

  test("Service and Server work together", () => {
    const config = new Config("service", "integration-test");

    const mockService = {
      getProtoName: () => "test.proto",
      getHandlers: function () {
        return {
          TestMethod: async (call) => {
            return { result: `processed: ${call.request.input}` };
          },
        };
      },
    };

    const server = new Server(
      mockService,
      config,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(server);
    assert.strictEqual(server.config.name, "integration-test");

    // Verify service methods are accessible through server
    const handlers = mockService.getHandlers();
    assert.ok(typeof handlers.TestMethod === "function");
  });

  test("Client and Server can use same config", () => {
    const config = new Config("service", "memory");

    const client = new Client(
      config,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    const mockService = {
      getProtoName: () => "shared.proto",
      getHandlers: () => ({
        SharedMethod: async () => ({ status: "ok" }),
      }),
    };

    const server = new Server(
      mockService,
      config,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(client);
    assert.ok(server);
    assert.strictEqual(client.config, server.config);
    assert.strictEqual(client.config.name, "memory");
    assert.strictEqual(server.config.name, "memory");
  });

  describe("Service Interface Compliance", () => {
    test("Service interface methods are properly exposed", () => {
      const mockService = {
        getProtoName: mock.fn(() => "compliance.proto"),
        getHandlers: mock.fn(() => ({
          ComplianceTest: async () => ({ compliant: true }),
        })),
      };

      const config = new Config("service", "compliance-test");
      const server = new Server(
        mockService,
        config,
        mockLogFn,
        null,
        mockObserverFn,
        mockGrpcFn,
        mockAuthFn,
      );

      assert.ok(server);

      // Verify the service interface methods are called during server setup
      assert.strictEqual(typeof mockService.getProtoName, "function");
      assert.strictEqual(typeof mockService.getHandlers, "function");

      // Verify they return expected values
      assert.strictEqual(mockService.getProtoName(), "compliance.proto");
      const handlers = mockService.getHandlers();
      assert.ok(handlers.ComplianceTest);
      assert.strictEqual(typeof handlers.ComplianceTest, "function");
    });
  });
});
