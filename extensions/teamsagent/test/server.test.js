/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { Authorizer } from "../auth.js";
import { parseBody } from "../http.js";
import createServer, { AgentServer } from "../server.js";

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
    ProcessRequest: async () => ({
      messages: [{ role: "assistant", content: "Test response" }],
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

describe("TeamsAgentServer", () => {
  test("throws error when agentConfig is not provided", () => {
    assert.throws(
      () =>
        new AgentServer(
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
        new AgentServer(
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
        new AgentServer(
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
        new AgentServer(
          createMockAgentConfig(),
          createMockAgentClient(),
          createMockAuthorizer(),
          null,
        ),
      { message: "logger is required" },
    );
  });

  test("creates server instance with valid dependencies", () => {
    const server = new AgentServer(
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
  test("returns TeamsAgentServer instance", () => {
    const server = createServer(
      createMockAgentConfig(),
      createMockExtensionConfig(),
      createMockAgentClient(),
      createMockAuthorizer(),
      createMockLogger(),
    );

    assert.ok(server instanceof AgentServer);
  });
});

describe("TeamsAgentServer routes", () => {
  let teamsServer;
  let mockAgentClient;
  let mockAuthorizer;

  beforeEach(() => {
    mockAgentClient = createMockAgentClient();
    mockAuthorizer = createMockAuthorizer();
    teamsServer = new AgentServer(
      createMockAgentConfig(),
      mockAgentClient,
      mockAuthorizer,
      createMockLogger(),
    );
  });

  test("returns 404 for unknown routes", async () => {
    const req = createMockRequest({ method: "GET", url: "/unknown" });
    const res = createMockResponse();

    const requestHandler = teamsServer.server.listeners("request")[0];
    await requestHandler(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body, "Not found");
  });

  test("returns 404 for GET on /api/messages", async () => {
    const req = createMockRequest({ method: "GET", url: "/api/messages" });
    const res = createMockResponse();

    const requestHandler = teamsServer.server.listeners("request")[0];
    await requestHandler(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body, "Not found");
  });

  test("returns 401 for unauthorized POST /api/messages", async () => {
    const unauthorizedServer = new AgentServer(
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

    const requestHandler = teamsServer.server.listeners("request")[0];
    const handlerPromise = requestHandler(req, res);
    req.simulateBody();
    await handlerPromise;

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers["Content-Type"], "application/json");

    const responseBody = JSON.parse(res.body);
    assert.ok(responseBody.reply);
  });

  test("returns 500 when agent client throws error", async () => {
    const errorClient = createMockAgentClient({
      ProcessRequest: async () => {
        throw new Error("Agent service unavailable");
      },
    });

    const errorServer = new AgentServer(
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
    assert.throws(() => new Authorizer(), { message: "secret is required" });
  });

  test("throws error when secret is empty string", () => {
    assert.throws(() => new Authorizer(""), { message: "secret is required" });
  });

  test("creates instance with valid secret", () => {
    const authorizer = new Authorizer("valid-secret");
    assert.ok(authorizer);
  });

  test("returns false when authorization header is missing", () => {
    const authorizer = new Authorizer("valid-secret");

    const req = createMockRequest({
      headers: {},
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, false);
  });

  test("returns true when Bearer token matches secret", () => {
    const authorizer = new Authorizer("valid-secret");

    const req = createMockRequest({
      headers: { authorization: "Bearer valid-secret" },
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, true);
  });

  test("returns true when token matches secret without Bearer prefix", () => {
    const authorizer = new Authorizer("valid-secret");

    const req = createMockRequest({
      headers: { authorization: "valid-secret" },
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, true);
  });

  test("returns false when token does not match secret", () => {
    const authorizer = new Authorizer("valid-secret");

    const req = createMockRequest({
      headers: { authorization: "Bearer wrong-token" },
    });

    const result = authorizer.authorize(req);

    assert.strictEqual(result, false);
  });
});
