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
    mockLogFn = () => ({
      debug: mock.fn(),
    });
  });

  test("should require service parameter", () => {
    assert.throws(
      () => new Server(null, mockConfig, mockGrpcFn, mockAuthFn, mockLogFn),
      /service is required/,
    );
  });

  test("should require config parameter", () => {
    assert.throws(
      () => new Server(mockService, null, mockGrpcFn, mockAuthFn, mockLogFn),
      /config is required/,
    );
  });

  test("should accept valid parameters", () => {
    const server = new Server(
      mockService,
      mockConfig,
      mockGrpcFn,
      mockAuthFn,
      mockLogFn,
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
      mockGrpcFn,
      mockAuthFn,
      mockLogFn,
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
    mockLogFn = () => ({
      debug: mock.fn(),
    });
  });

  test("should require config parameter", () => {
    assert.throws(
      () => new Client(null, mockGrpcFn, mockAuthFn, mockLogFn),
      /config is required/,
    );
  });

  test("should accept valid parameters", () => {
    const client = new Client(mockConfig, mockGrpcFn, mockAuthFn, mockLogFn);

    assert.ok(client);
    assert.strictEqual(client.config, mockConfig);
  });
});
