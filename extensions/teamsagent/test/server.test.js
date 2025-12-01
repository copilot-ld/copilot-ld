/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { authorize } from "../auth.js";
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
 * Creates a mock config object
 * @returns {object} Mock config
 */
function createMockConfig() {
  return {
    githubToken: async () => "test-github-token",
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
  };
}

describe("TeamsAgentServer", () => {
  test("throws error when config is not provided", () => {
    assert.throws(
      () => new AgentServer(null, createMockAgentClient(), createMockLogger()),
      { message: "config is required" },
    );
  });

  test("throws error when agentClient is not provided", () => {
    assert.throws(
      () => new AgentServer(createMockConfig(), null, createMockLogger()),
      { message: "agentClient is required" },
    );
  });

  test("throws error when logger is not provided", () => {
    assert.throws(
      () => new AgentServer(createMockConfig(), createMockAgentClient(), null),
      { message: "logger is required" },
    );
  });

  test("creates server instance with valid dependencies", () => {
    const server = new AgentServer(
      createMockConfig(),
      createMockAgentClient(),
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
      createMockConfig(),
      createMockAgentClient(),
      createMockLogger(),
    );

    assert.ok(server instanceof AgentServer);
  });

  test("creates default logger when not provided", () => {
    const server = createServer(createMockConfig(), createMockAgentClient());

    assert.ok(server instanceof AgentServer);
  });
});

describe("TeamsAgentServer routes", () => {
  let teamsServer;
  let mockAgentClient;

  beforeEach(() => {
    mockAgentClient = createMockAgentClient();
    teamsServer = new AgentServer(
      createMockConfig(),
      mockAgentClient,
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
    const originalSecret = process.env.TEAMS_AGENT_SECRET;
    process.env.TEAMS_AGENT_SECRET = "valid-secret";

    const req = createMockRequest({
      method: "POST",
      url: "/api/messages",
      body: { message: "Hello" },
      headers: { authorization: "Bearer wrong-token" },
    });
    const res = createMockResponse();

    const requestHandler = teamsServer.server.listeners("request")[0];
    const handlerPromise = requestHandler(req, res);
    req.simulateBody();
    await handlerPromise;

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body, "Unauthorized");

    process.env.TEAMS_AGENT_SECRET = originalSecret;
  });

  test("returns 200 with agent response for authorized POST /api/messages", async () => {
    const originalSecret = process.env.TEAMS_AGENT_SECRET;
    process.env.TEAMS_AGENT_SECRET = "valid-secret";

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

    process.env.TEAMS_AGENT_SECRET = originalSecret;
  });

  test("returns 500 when agent client throws error", async () => {
    const originalSecret = process.env.TEAMS_AGENT_SECRET;
    process.env.TEAMS_AGENT_SECRET = "valid-secret";

    const errorClient = createMockAgentClient({
      ProcessRequest: async () => {
        throw new Error("Agent service unavailable");
      },
    });

    const errorServer = new AgentServer(
      createMockConfig(),
      errorClient,
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

    process.env.TEAMS_AGENT_SECRET = originalSecret;
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

describe("authorize", () => {
  const originalEnv = process.env.TEAMS_AGENT_SECRET;

  test("returns false when TEAMS_AGENT_SECRET is not set", () => {
    delete process.env.TEAMS_AGENT_SECRET;

    const req = createMockRequest({
      headers: { authorization: "Bearer test-token" },
    });

    const result = authorize(req);

    assert.strictEqual(result, false);
  });

  test("returns false when authorization header is missing", () => {
    process.env.TEAMS_AGENT_SECRET = "valid-secret";

    const req = createMockRequest({
      headers: {},
    });

    const result = authorize(req);

    assert.strictEqual(result, false);

    process.env.TEAMS_AGENT_SECRET = originalEnv;
  });

  test("returns true when Bearer token matches secret", () => {
    process.env.TEAMS_AGENT_SECRET = "valid-secret";

    const req = createMockRequest({
      headers: { authorization: "Bearer valid-secret" },
    });

    const result = authorize(req);

    assert.strictEqual(result, true);

    process.env.TEAMS_AGENT_SECRET = originalEnv;
  });

  test("returns true when token matches secret without Bearer prefix", () => {
    process.env.TEAMS_AGENT_SECRET = "valid-secret";

    const req = createMockRequest({
      headers: { authorization: "valid-secret" },
    });

    const result = authorize(req);

    assert.strictEqual(result, true);

    process.env.TEAMS_AGENT_SECRET = originalEnv;
  });

  test("returns false when token does not match secret", () => {
    process.env.TEAMS_AGENT_SECRET = "valid-secret";

    const req = createMockRequest({
      headers: { authorization: "Bearer wrong-token" },
    });

    const result = authorize(req);

    assert.strictEqual(result, false);

    process.env.TEAMS_AGENT_SECRET = originalEnv;
  });
});
