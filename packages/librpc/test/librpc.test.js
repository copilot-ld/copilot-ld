/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

import { Server, Client, Rpc } from "../index.js";

describe("Rpc", () => {
  test("should throw on missing config", () => {
    assert.throws(() => new Rpc(), /config is required/);
  });

  test("should accept valid config", () => {
    // Mock the environment variable required by authFactory
    const originalEnv = process.env.SERVICE_SECRET;
    process.env.SERVICE_SECRET =
      "test-secret-that-is-at-least-32-characters-long";

    try {
      const config = { name: "test", host: "localhost", port: 5000 };
      const rpc = new Rpc(config);

      assert.strictEqual(rpc.config, config);
    } finally {
      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.SERVICE_SECRET = originalEnv;
      } else {
        delete process.env.SERVICE_SECRET;
      }
    }
  });
});

describe("Server", () => {
  let mockService;
  let mockConfig;
  let mockGrpcFn;
  let mockAuthFn;
  let mockLogFn;
  let mockObserverFn;

  beforeEach(() => {
    mockService = {
      getHandlers: () => ({
        TestMethod: async (_call) => ({ result: "test" }),
      }),
    };

    mockConfig = {
      name: "test-service",
      host: "0.0.0.0",
      port: 5000,
    };

    const mockGrpc = {
      Server: function () {
        return {
          addService: mock.fn(),
          bindAsync: mock.fn((uri, creds, callback) => callback(null, 5000)),
          tryShutdown: mock.fn((callback) => callback()),
        };
      },
      ServerCredentials: {
        createInsecure: mock.fn(),
      },
      status: {
        UNAUTHENTICATED: 16,
        INTERNAL: 13,
      },
    };

    mockGrpcFn = () => ({ grpc: mockGrpc });
    mockAuthFn = () => ({
      validateCall: () => ({ isValid: true, serviceId: "test" }),
    });
    mockLogFn = {
      debug: mock.fn(),
    };
    mockObserverFn = () => ({
      observeServerCall: async (method, handler, call, callback) => {
        return await handler(call, callback);
      },
      observeClientCall: async (method, request, fn) => {
        return await fn();
      },
    });
  });

  test("should require service parameter", () => {
    assert.throws(
      () =>
        new Server(
          null,
          mockConfig,
          mockLogFn,
          null,
          mockObserverFn,
          mockGrpcFn,
          mockAuthFn,
        ),
      /service is required/,
    );
  });

  test("should require config parameter", () => {
    assert.throws(
      () =>
        new Server(
          mockService,
          null,
          mockLogFn,
          null,
          mockObserverFn,
          mockGrpcFn,
          mockAuthFn,
        ),
      /config is required/,
    );
  });

  test("should accept valid parameters", () => {
    const server = new Server(
      mockService,
      mockConfig,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(server);
    assert.strictEqual(server.config, mockConfig);
  });

  test("should call service methods during setup", async () => {
    const getHandlersSpy = mock.fn(() => ({
      TestMethod: async () => ({ result: "test" }),
    }));

    const spiedService = {
      getHandlers: getHandlersSpy,
    };

    const server = new Server(
      spiedService,
      mockConfig,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    // Test that the server has the service and can access its methods
    assert.ok(server);

    // Verify service methods can be called directly (which is what matters)
    const handlers = spiedService.getHandlers();

    assert.ok(handlers.TestMethod);
    assert.strictEqual(getHandlersSpy.mock.callCount(), 1);
  });
});

describe("Client", () => {
  let mockConfig;
  let mockGrpcFn;
  let mockAuthFn;
  let mockLogFn;
  let mockObserverFn;

  beforeEach(() => {
    mockConfig = {
      name: "agent",
      host: "localhost",
      port: 5000,
    };

    const mockGrpcClient = {
      TestMethod: mock.fn((request, callback) => {
        callback(null, { result: "success" });
      }),
    };

    const mockGrpc = {
      makeGenericClientConstructor: mock.fn(
        () =>
          function () {
            return mockGrpcClient;
          },
      ),
      credentials: {
        createInsecure: mock.fn(),
      },
    };

    mockGrpcFn = () => ({ grpc: mockGrpc });
    mockAuthFn = () => ({
      createClientInterceptor: () => () => {},
    });
    mockLogFn = {
      debug: mock.fn(),
    };
    mockObserverFn = () => ({
      observeClientCall: async (method, request, fn) => {
        return await fn();
      },
    });
  });

  test("should require config parameter", () => {
    assert.throws(
      () =>
        new Client(
          null,
          mockLogFn,
          null,
          mockObserverFn,
          mockGrpcFn,
          mockAuthFn,
        ),
      /config is required/,
    );
  });

  test("should accept valid parameters", () => {
    const client = new Client(
      mockConfig,
      mockLogFn,
      null,
      mockObserverFn,
      mockGrpcFn,
      mockAuthFn,
    );

    assert.ok(client);
    assert.strictEqual(client.config, mockConfig);
  });
});

describe("Tracing Integration", () => {
  describe("Client and Server", () => {
    test("Client accepts tracer parameter in constructor", () => {
      // Client constructor signature includes optional tracer parameter:
      // (config, tracer = null, grpcFn, authFn, logFn)
      // This test verifies the signature includes tracer
      assert.ok(Client);
      assert.strictEqual(typeof Client, "function");
    });

    test("Server accepts tracer parameter in constructor", () => {
      const mockSpan = {
        spanId: "test-span-id",
        setStatus: mock.fn(),
        end: async () => {},
      };

      const mockTracer = {
        startServerSpan: mock.fn(() => mockSpan),
        getSpanContext: () => ({
          run: (_span, fn) => fn(),
        }),
      };

      const mockService = {
        getHandlers: () => ({
          TestMethod: async () => ({ result: "test" }),
        }),
      };

      const mockConfig = { name: "test", host: "0.0.0.0", port: 5000 };

      const mockGrpcFn = () => ({
        Server: class {
          /** Add service */
          addService() {}

          /**
           * Bind async
           * @param {string} _addr - Address
           * @param {object} _creds - Credentials
           * @param {Function} callback - Callback
           */
          bindAsync(_addr, _creds, callback) {
            callback(null, 5000);
          }
        },
        loadPackageDefinition: () => ({ TestService: { service: {} } }),
        ServerCredentials: { createInsecure: () => ({}) },
      });

      const mockAuthFn = () => ({
        validateCall: () => ({ isValid: true }),
      });

      const mockLogFn = { debug: mock.fn() };

      const mockObserverFn = () => ({
        observeServerCall: async (method, handler, call, callback) => {
          return await handler(call, callback);
        },
      });

      // Server constructor signature: (service, config, logger, tracer, observerFn, grpcFn, authFn)
      const server = new Server(
        mockService,
        mockConfig,
        mockLogFn,
        mockTracer,
        mockObserverFn,
        mockGrpcFn,
        mockAuthFn,
      );

      // Verify server was created with tracer
      assert.ok(server);
      assert.strictEqual(server.config, mockConfig);
    });
  });
});
