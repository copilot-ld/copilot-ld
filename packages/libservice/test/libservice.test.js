/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

// Module under test
import { Actor, Client, Service, createClient } from "../index.js";

// Internal classes for testing
import { HmacAuth, Interceptor } from "../auth.js";

describe("libservice", () => {
  let mockConfig,
    mockGrpcFactory,
    mockAuthFactory,
    mockServiceGrpcFactory,
    mockLogFactory;

  beforeEach(() => {
    process.env.SERVICE_AUTH_SECRET = "a".repeat(32);
    mockConfig = {
      name: "test",
      host: "localhost",
      port: 3000,
    };

    const mockServiceClass = function (_uri, _credentials, _options) {
      this.TestMethod = (request, callback) =>
        callback(null, { success: true });
    };

    // For Client tests - returns the service class directly
    mockGrpcFactory = () => ({
      grpc: {
        Server: function () {
          return {
            addService: () => {},
            bindAsync: (uri, creds, callback) => callback(null, 3000),
            tryShutdown: (callback) => callback(),
          };
        },
        loadPackageDefinition: () => ({
          test: {
            Test: mockServiceClass,
          },
        }),
        credentials: { createInsecure: () => ({}) },
        ServerCredentials: { createInsecure: () => ({}) },
        status: { UNAUTHENTICATED: 16, INTERNAL: 13 },
      },
      protoLoader: { loadSync: () => ({}) },
    });

    // For Service tests - returns the service with .service property
    mockServiceGrpcFactory = () => ({
      grpc: {
        Server: function () {
          return {
            addService: () => {},
            bindAsync: (uri, creds, callback) => callback(null, 3000),
            tryShutdown: (callback) => callback(),
          };
        },
        loadPackageDefinition: () => ({
          test: {
            Test: {
              service: {
                TestMethod: {},
              },
            },
          },
        }),
        credentials: { createInsecure: () => ({}) },
        ServerCredentials: { createInsecure: () => ({}) },
        status: { UNAUTHENTICATED: 16, INTERNAL: 13 },
      },
      protoLoader: { loadSync: () => ({}) },
    });

    mockAuthFactory = () => ({
      createClientInterceptor: () => () => {},
      validateCall: () => ({ isValid: true, serviceId: "test" }),
    });

    mockLogFactory = () => ({
      debug: () => {},
    });
  });

  describe("Actor", () => {
    test("creates Actor and validates dependencies", () => {
      const actor = new Actor(
        mockConfig,
        mockGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );

      assert.ok(actor instanceof Actor);
      assert.strictEqual(actor.config, mockConfig);
      assert.ok(typeof actor.grpc().Server === "function");
      assert.ok(typeof actor.protoLoader().loadSync === "function");
      assert.ok(typeof actor.auth().createClientInterceptor === "function");
      assert.ok(typeof actor.debug === "function");
    });

    test("validates constructor parameters", () => {
      assert.throws(() => new Actor(), { message: /config is required/ });
      assert.throws(() => new Actor(mockConfig, "invalid"), {
        message: /grpcFactory must be a function/,
      });
      assert.throws(() => new Actor(mockConfig, mockGrpcFactory, "invalid"), {
        message: /authFactory must be a function/,
      });
      assert.throws(
        () =>
          new Actor(mockConfig, mockGrpcFactory, mockAuthFactory, "invalid"),
        {
          message: /logFactory must be a function/,
        },
      );
    });

    test("loads proto definition", async () => {
      const actor = new Actor(
        mockConfig,
        mockServiceGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );
      const proto = await actor.loadProto("test");

      assert.ok(proto);
      assert.ok(proto.Test);
    });
  });

  describe("Client", () => {
    test("creates Client and validates auth requirement", () => {
      const client = new Client(
        mockConfig,
        mockGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );

      assert.ok(client instanceof Client);
      assert.ok(client instanceof Actor);

      delete process.env.SERVICE_AUTH_SECRET;
      assert.throws(() => new Client(mockConfig), {
        message: /SERVICE_AUTH_SECRET environment variable is required/,
      });
      process.env.SERVICE_AUTH_SECRET = "a".repeat(32);
    });

    test("initializes and allows subclasses to implement explicit RPC methods", async () => {
      class GeneratedTestClient extends Client {
        async TestMethod(request) {
          return this.callMethod("TestMethod", request);
        }
      }

      const client = new GeneratedTestClient(
        mockConfig,
        mockGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );
      await client.ensureReady();

      assert.ok(typeof client.TestMethod === "function");

      const result = await client.TestMethod({ data: "test" });
      assert.deepStrictEqual(result, { success: true });
    });

    test("handles errors", async () => {
      const errorFactory = () => ({
        grpc: {
          loadPackageDefinition: () => {
            throw new Error("Proto error");
          },
        },
        protoLoader: {
          loadSync: () => {
            throw new Error("ENOENT");
          },
        },
      });

      const client = new Client(
        mockConfig,
        errorFactory,
        mockAuthFactory,
        mockLogFactory,
      );
      await assert.rejects(() => client.ensureReady(), { message: /ENOENT/ });
    });
  });

  describe("Service", () => {
    test("creates Service and validates auth requirement", () => {
      const service = new Service(
        mockConfig,
        mockServiceGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );

      assert.ok(service instanceof Service);
      assert.ok(service instanceof Actor);

      delete process.env.SERVICE_AUTH_SECRET;
      assert.throws(() => new Service(mockConfig), {
        message: /SERVICE_AUTH_SECRET environment variable is required/,
      });
      process.env.SERVICE_AUTH_SECRET = "a".repeat(32);
    });

    test("starts service and validates implementation", async () => {
      class TestService extends Service {
        async TestMethod() {
          return { success: true };
        }
      }

      const service = new TestService(
        mockConfig,
        mockServiceGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );
      const port = await service.start();

      assert.strictEqual(port, 3000);

      await assert.rejects(() => service.start(), {
        message: /Server is already started/,
      });
    });

    test("validates required method implementation", async () => {
      const service = new Service(
        mockConfig,
        mockServiceGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );

      await assert.rejects(() => service.start(), {
        message: /Missing RPC method implementation: TestMethod/,
      });
    });
  });

  describe("createClient", () => {
    test("creates client with configuration", async () => {
      const client = await createClient(
        "test",
        { port: 4000 },
        mockGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );
      assert.ok(client instanceof Client);
      assert.strictEqual(client.config.name, "test");
      assert.strictEqual(client.config.port, 4000);
    });

    // Interface exports removed
  });

  describe("Error handling", () => {
    test("handles invalid factory return values", () => {
      const invalidGrpcFactory = () => null;
      assert.throws(
        () =>
          new Actor(
            mockConfig,
            invalidGrpcFactory,
            mockAuthFactory,
            mockLogFactory,
          ),
        {
          message: /Cannot destructure property/,
        },
      );
    });

    test("handles proto loading and service errors", async () => {
      const errorGrpcFactory = () => ({
        grpc: {
          Server: mockServiceGrpcFactory().grpc.Server,
          loadPackageDefinition: () => {
            throw new Error("Proto file not found");
          },
        },
        protoLoader: {
          loadSync: () => {
            throw new Error("ENOENT");
          },
        },
      });

      const service = new Service(
        mockConfig,
        errorGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );
      await assert.rejects(() => service.start(), { message: /ENOENT/ });

      const client = new Client(
        mockConfig,
        errorGrpcFactory,
        mockAuthFactory,
        mockLogFactory,
      );
      await assert.rejects(() => client.ensureReady(), { message: /ENOENT/ });
    });
  });

  describe("HmacAuth", () => {
    test("creates and validates HMAC authentication", () => {
      const secret = "a".repeat(32);
      const auth = new HmacAuth(secret);

      assert.ok(auth instanceof HmacAuth);
      assert.throws(() => new HmacAuth("short"), {
        message: /Secret must be at least 32 characters long/,
      });

      const token = auth.generateToken("test-service");
      assert.ok(typeof token === "string");

      const validResult = auth.verifyToken(token);
      assert.ok(validResult.isValid);
      assert.strictEqual(validResult.serviceId, "test-service");

      const invalidResult = auth.verifyToken("invalid-token");
      assert.strictEqual(invalidResult.isValid, false);
      assert.ok(invalidResult.error);
    });
  });

  describe("Interceptor", () => {
    test("creates and uses client interceptor", () => {
      const auth = new HmacAuth("a".repeat(32));
      const interceptor = new Interceptor(auth, "test-service");

      assert.ok(interceptor instanceof Interceptor);
      assert.throws(() => new Interceptor(null, "test"), {
        message: /Authenticator is required/,
      });
      assert.throws(() => new Interceptor(auth, ""), {
        message: /Service ID must be a non-empty string/,
      });

      const clientInterceptor = interceptor.createClientInterceptor();
      assert.ok(typeof clientInterceptor === "function");
    });

    test("validates call authentication", () => {
      const auth = new HmacAuth("a".repeat(32));
      const interceptor = new Interceptor(auth, "test-service");
      const token = auth.generateToken("client-service");

      const validCall = {
        metadata: {
          get: (key) => (key === "authorization" ? [`Bearer ${token}`] : []),
        },
      };

      const validResult = interceptor.validateCall(validCall);
      assert.ok(validResult.isValid);
      assert.strictEqual(validResult.serviceId, "client-service");

      const invalidCall = {
        metadata: {
          get: (key) =>
            key === "authorization" ? ["Bearer invalid-token"] : [],
        },
      };

      const invalidResult = interceptor.validateCall(invalidCall);
      assert.strictEqual(invalidResult.isValid, false);
      assert.ok(invalidResult.error);
    });
  });
});
