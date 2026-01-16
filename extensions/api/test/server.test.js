import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  LocalSecretAuthorizer,
  ApiExtension,
  createApiExtension,
} from "../index.js";
import {
  createMockRequest,
  createMockResponse,
  createMockExtensionConfig,
  createSilentLogger,
  createMockAgentClient,
} from "@copilot-ld/libharness";

// Local wrappers using shared mocks
const createMockConfig = () => createMockExtensionConfig("api");
const createMockLogger = () => createSilentLogger();
const createMockClient = (overrides = {}) =>
  createMockAgentClient({
    ProcessUnary: async () => ({
      messages: [{ role: "assistant", content: "Test response" }],
      resource_id: "test-resource-id",
    }),
    ...overrides,
  });

/**
 * Creates a mock authorizer
 * @returns {object} Mock authorizer
 */
function createMockAuthorizer() {
  return {
    authorize: () => true,
  };
}

describe("ApiExtension", () => {
  test("throws error when config is not provided", () => {
    assert.throws(
      () =>
        new ApiExtension(
          null,
          createMockClient(),
          createMockAuthorizer(),
          createMockLogger(),
        ),
      { message: "config is required" },
    );
  });

  test("throws error when client is not provided", () => {
    assert.throws(
      () =>
        new ApiExtension(
          createMockConfig(),
          null,
          createMockAuthorizer(),
          createMockLogger(),
        ),
      { message: "client is required" },
    );
  });

  test("throws error when authorizer is not provided", () => {
    assert.throws(
      () =>
        new ApiExtension(
          createMockConfig(),
          createMockClient(),
          null,
          createMockLogger(),
        ),
      { message: "authorizer is required" },
    );
  });

  test("throws error when logger is not provided", () => {
    assert.throws(
      () =>
        new ApiExtension(
          createMockConfig(),
          createMockClient(),
          createMockAuthorizer(),
          null,
        ),
      { message: "logger is required" },
    );
  });

  test("creates server instance with valid dependencies", () => {
    const server = new ApiExtension(
      createMockConfig(),
      createMockClient(),
      createMockAuthorizer(),
      createMockLogger(),
    );

    assert.ok(server);
    assert.ok(server.server);
    assert.strictEqual(typeof server.listen, "function");
    assert.strictEqual(typeof server.close, "function");
  });
});

describe("createApiExtension factory", () => {
  test("returns ApiExtension instance", () => {
    const server = createApiExtension(
      createMockClient(),
      createMockConfig(),
      createMockLogger(),
    );

    assert.ok(server instanceof ApiExtension);
  });
});

describe("ApiExtension routes", () => {
  let server;
  let mockClient;
  let mockAuthorizer;

  beforeEach(() => {
    mockClient = createMockClient();
    mockAuthorizer = createMockAuthorizer();
    server = new ApiExtension(
      createMockConfig(),
      mockClient,
      mockAuthorizer,
      createMockLogger(),
    );
  });

  test("returns 404 for unknown routes", async () => {
    const req = createMockRequest({ method: "GET", url: "/unknown" });
    const res = createMockResponse();

    const requestHandler = server.server.listeners("request")[0];
    await requestHandler(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body, "Not found");
  });

  test("returns 404 for GET on /api/messages", async () => {
    const req = createMockRequest({ method: "GET", url: "/api/messages" });
    const res = createMockResponse();

    const requestHandler = server.server.listeners("request")[0];
    await requestHandler(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body, "Not found");
  });

  test("returns 401 for unauthorized POST /api/messages", async () => {
    const unauthorizedServer = new ApiExtension(
      createMockConfig(),
      mockClient,
      { authorize: () => false },
      createMockLogger(),
    );

    const req = createMockRequest({
      method: "POST",
      url: "/api/messages",
      body: { message: "Hello" },
      headers: { authorization: "Bearer wrong-token" },
    });
    const res = createMockResponse();

    const requestHandler = unauthorizedServer.server.listeners("request")[0];
    const handlerPromise = requestHandler(req, res);
    req.simulateBody();
    await handlerPromise;

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body, "Unauthorized");
  });

  test("returns 200 with agent response for authorized POST /api/messages", async () => {
    const req = createMockRequest({
      method: "POST",
      url: "/api/messages",
      body: { message: "Hello", correlationId: "123", resourceId: "res-456" },
      headers: { authorization: "Bearer valid-secret" },
    });
    const res = createMockResponse();

    const requestHandler = server.server.listeners("request")[0];
    const handlerPromise = requestHandler(req, res);
    req.simulateBody();
    await handlerPromise;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers["Content-Type"], "application/json");

    const responseBody = JSON.parse(res.body);
    assert.ok(responseBody.reply);
    assert.ok(responseBody.reply.messages);
    assert.strictEqual(responseBody.reply.messages[0].content, "Test response");
    assert.strictEqual(responseBody.reply.resource_id, "test-resource-id");
  });

  test("returns full messages array from agent response", async () => {
    const customClient = createMockClient({
      ProcessUnary: async () => ({
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
        ],
        resource_id: "custom-resource",
      }),
    });

    const customServer = new ApiExtension(
      createMockConfig(),
      customClient,
      createMockAuthorizer(),
      createMockLogger(),
    );

    const req = createMockRequest({
      method: "POST",
      url: "/api/messages",
      body: { message: "Hello" },
      headers: { authorization: "Bearer valid-secret" },
    });
    const res = createMockResponse();

    const requestHandler = customServer.server.listeners("request")[0];
    const handlerPromise = requestHandler(req, res);
    req.simulateBody();
    await handlerPromise;

    const responseBody = JSON.parse(res.body);
    assert.strictEqual(responseBody.reply.messages.length, 2);
    assert.strictEqual(responseBody.reply.messages[0].role, "user");
    assert.strictEqual(responseBody.reply.messages[0].content, "Hello");
    assert.strictEqual(responseBody.reply.messages[1].role, "assistant");
    assert.strictEqual(responseBody.reply.messages[1].content, "Hi there!");
    assert.strictEqual(responseBody.reply.resource_id, "custom-resource");
  });

  test("returns 500 when agent client throws error", async () => {
    const errorClient = createMockClient({
      ProcessUnary: async () => {
        throw new Error("Agent service unavailable");
      },
    });

    const errorServer = new ApiExtension(
      createMockConfig(),
      errorClient,
      createMockAuthorizer(),
      createMockLogger(),
    );

    const req = createMockRequest({
      method: "POST",
      url: "/api/messages",
      body: { message: "Hello" },
      headers: { authorization: "Bearer valid-secret" },
    });
    const res = createMockResponse();

    const requestHandler = errorServer.server.listeners("request")[0];
    const handlerPromise = requestHandler(req, res);
    req.simulateBody();
    await handlerPromise;

    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.body, "Internal Server Error");
  });
});

describe("LocalSecretAuthorizer", () => {
  test("throws error when secret is not provided", () => {
    assert.throws(() => new LocalSecretAuthorizer(), {
      message: "secret is required",
    });
  });

  test("throws error when secret is empty string", () => {
    assert.throws(() => new LocalSecretAuthorizer(""), {
      message: "secret is required",
    });
  });

  test("creates instance with valid secret", () => {
    const authorizer = new LocalSecretAuthorizer("valid-secret");
    assert.ok(authorizer);
  });

  test("returns false when authorization header is missing", () => {
    const authorizer = new LocalSecretAuthorizer("valid-secret");

    const req = createMockRequest({
      headers: {},
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, false);
  });

  test("returns true when Bearer token matches secret", () => {
    const authorizer = new LocalSecretAuthorizer("valid-secret");

    const req = createMockRequest({
      headers: { authorization: "Bearer valid-secret" },
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, true);
  });

  test("returns true when token matches secret without Bearer prefix", () => {
    const authorizer = new LocalSecretAuthorizer("valid-secret");

    const req = createMockRequest({
      headers: { authorization: "valid-secret" },
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, true);
  });

  test("returns false when token does not match secret", () => {
    const authorizer = new LocalSecretAuthorizer("valid-secret");

    const req = createMockRequest({
      headers: { authorization: "Bearer wrong-token" },
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, false);
  });
});
