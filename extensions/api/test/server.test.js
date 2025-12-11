/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { LocalSecretAuthorizer } from "../auth.js";
import { parseBody } from "../http.js";
import createServer, { Server } from "../server.js";

/**
 * Creates a mock HTTP request object with event emitter behavior
 * @param {object} options - Request options
 * @returns {object} Mock request object
 */
function createMockRequest(options = {}) {
  const { method = "GET", url = "/", body = {}, headers = {} } = options;
  const bodyStr = JSON.stringify(body);
  let dataCallback;
  let endCallback;
  let errorCallback;

  return {
    method,
    url,
    headers,
    on: (event, callback) => {
      if (event === "data") dataCallback = callback;
      if (event === "end") endCallback = callback;
      if (event === "error") errorCallback = callback;
    },
    simulateBody: () => {
      if (dataCallback) dataCallback(bodyStr);
      if (endCallback) endCallback();
    },
    simulateError: (err) => {
      if (errorCallback) errorCallback(err);
    },
  };
}

/**
 * Creates a mock HTTP response object
 * @returns {object} Mock response object with tracking
 */
function createMockResponse() {
  const response = {
    headersSent: false,
    statusCode: null,
    headers: {},
    body: "",
    writeHead: (status, headers) => {
      response.statusCode = status;
      response.headers = headers || {};
      response.headersSent = true;
    },
    end: (data) => {
      response.body = data || "";
    },
  };
  return response;
}

/**
 * Creates a mock agent config object
 * @returns {object} Mock agent config
 */
function createMockAgentConfig() {
  return {
    githubToken: async () => "test-github-token",
  };
}

/**
 * Creates a mock extension config object
 * @returns {object} Mock extension config
 */
function createMockExtensionConfig() {
  return {
    secret: "test-secret",
  };
}

/**
 * Creates a mock agent client
 * @param {object} overrides - Properties to override
 * @returns {object} Mock agent client
 */
function createMockAgentClient(overrides = {}) {
  return {
    ProcessUnary: async () => ({
      messages: [{ role: "assistant", content: "Test response" }],
      resource_id: "test-resource-id",
    }),
    ...overrides,
  };
}

/**
 * Creates a mock logger
 * @returns {object} Mock logger
 */
function createMockLogger() {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };
}

/**
 * Creates a mock authorizer
 * @returns {object} Mock authorizer
 */
function createMockAuthorizer() {
  return {
    authorize: () => true,
  };
}

describe("Server", () => {
  test("throws error when agentConfig is not provided", () => {
    assert.throws(
      () =>
        new Server(
          null,
          createMockAgentClient(),
          createMockAuthorizer(),
          createMockLogger(),
        ),
      { message: "agentConfig is required" },
    );
  });

  test("throws error when agentClient is not provided", () => {
    assert.throws(
      () =>
        new Server(
          createMockAgentConfig(),
          null,
          createMockAuthorizer(),
          createMockLogger(),
        ),
      { message: "agentClient is required" },
    );
  });

  test("throws error when authorizer is not provided", () => {
    assert.throws(
      () =>
        new Server(
          createMockAgentConfig(),
          createMockAgentClient(),
          null,
          createMockLogger(),
        ),
      { message: "authorizer is required" },
    );
  });

  test("throws error when logger is not provided", () => {
    assert.throws(
      () =>
        new Server(
          createMockAgentConfig(),
          createMockAgentClient(),
          createMockAuthorizer(),
          null,
        ),
      { message: "logger is required" },
    );
  });

  test("creates server instance with valid dependencies", () => {
    const server = new Server(
      createMockAgentConfig(),
      createMockAgentClient(),
      createMockAuthorizer(),
      createMockLogger(),
    );

    assert.ok(server);
    assert.ok(server.server);
    assert.strictEqual(typeof server.listen, "function");
    assert.strictEqual(typeof server.close, "function");
  });
});

describe("createServer factory", () => {
  test("returns Server instance", () => {
    const server = createServer(
      createMockAgentConfig(),
      createMockExtensionConfig(),
      createMockAgentClient(),
      createMockAuthorizer(),
      createMockLogger(),
    );

    assert.ok(server instanceof Server);
  });
});

describe("Server routes", () => {
  let server;
  let mockAgentClient;
  let mockAuthorizer;

  beforeEach(() => {
    mockAgentClient = createMockAgentClient();
    mockAuthorizer = createMockAuthorizer();
    server = new Server(
      createMockAgentConfig(),
      mockAgentClient,
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
    const unauthorizedServer = new Server(
      createMockAgentConfig(),
      mockAgentClient,
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
    const customClient = createMockAgentClient({
      ProcessUnary: async () => ({
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
        ],
        resource_id: "custom-resource",
      }),
    });

    const customServer = new Server(
      createMockAgentConfig(),
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
    const errorClient = createMockAgentClient({
      ProcessUnary: async () => {
        throw new Error("Agent service unavailable");
      },
    });

    const errorServer = new Server(
      createMockAgentConfig(),
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

describe("parseBody", () => {
  test("parses valid JSON body", async () => {
    const req = createMockRequest({
      body: { message: "Hello", correlationId: "123" },
    });

    const parsePromise = parseBody(req);
    req.simulateBody();
    const result = await parsePromise;

    assert.deepStrictEqual(result, { message: "Hello", correlationId: "123" });
  });

  test("returns empty object for invalid JSON", async () => {
    const req = createMockRequest({ body: {} });
    let dataCallback;
    let endCallback;

    req.on = (event, callback) => {
      if (event === "data") dataCallback = callback;
      if (event === "end") endCallback = callback;
    };

    const parsePromise = parseBody(req);
    dataCallback("not valid json {{{");
    endCallback();
    const result = await parsePromise;

    assert.deepStrictEqual(result, {});
  });

  test("rejects on request error", async () => {
    const req = createMockRequest({ body: {} });
    const testError = new Error("Connection reset");

    const parsePromise = parseBody(req);
    req.simulateError(testError);

    await assert.rejects(() => parsePromise, {
      message: "Connection reset",
    });
  });

  test("handles empty body", async () => {
    const req = createMockRequest({ body: {} });
    let dataCallback;
    let endCallback;

    req.on = (event, callback) => {
      if (event === "data") dataCallback = callback;
      if (event === "end") endCallback = callback;
    };

    const parsePromise = parseBody(req);
    dataCallback("");
    endCallback();
    const result = await parsePromise;

    assert.deepStrictEqual(result, {});
  });
});

describe("Authorizer", () => {
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
