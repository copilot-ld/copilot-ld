import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { TeamsServer } from "../server.js";

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
 * Creates a mock tenant client service
 * @param {object} overrides - Properties to override
 * @returns {object} Mock tenant client service
 */
function createMockTenantClientService(overrides = {}) {
  return {
    getTenantConfig: async () => ({ host: "localhost", port: 3979 }),
    saveTenantConfig: async () => {},
    ...overrides,
  };
}

/**
 * Creates a mock HTML renderer
 * @param {object} overrides - Properties to override
 * @returns {object} Mock HTML renderer
 */
function createMockHtmlRenderer(overrides = {}) {
  return {
    serve: (path, res, contentType) => {
      res.writeHead(200, { "Content-Type": contentType || "text/html" });
      res.end(`<html>Mock content for ${path}</html>`);
    },
    ...overrides,
  };
}

/**
 * Creates a mock bot adapter
 * @param {object} overrides - Properties to override
 * @returns {object} Mock adapter
 */
function createMockAdapter(overrides = {}) {
  return {
    process: async (req, res, logic) => {
      await logic({ activity: {} });
    },
    ...overrides,
  };
}

/**
 * Creates a mock bot
 * @param {object} overrides - Properties to override
 * @returns {object} Mock bot
 */
function createMockBot(overrides = {}) {
  return {
    run: async () => {},
    ...overrides,
  };
}

describe("TeamsServer", () => {
  describe("constructor", () => {
    test("throws error when config is not provided", () => {
      assert.throws(
        () =>
          new TeamsServer(
            null,
            createMockTenantClientService(),
            createMockHtmlRenderer(),
            createMockAdapter(),
            createMockBot(),
          ),
        { message: "config is required" },
      );
    });

    test("throws error when tenantClientService is not provided", () => {
      assert.throws(
        () =>
          new TeamsServer(
            createMockConfig(),
            null,
            createMockHtmlRenderer(),
            createMockAdapter(),
            createMockBot(),
          ),
        { message: "tenantClientService is required" },
      );
    });

    test("throws error when htmlRenderer is not provided", () => {
      assert.throws(
        () =>
          new TeamsServer(
            createMockConfig(),
            createMockTenantClientService(),
            null,
            createMockAdapter(),
            createMockBot(),
          ),
        { message: "htmlRenderer is required" },
      );
    });

    test("throws error when adapter is not provided", () => {
      assert.throws(
        () =>
          new TeamsServer(
            createMockConfig(),
            createMockTenantClientService(),
            createMockHtmlRenderer(),
            null,
            createMockBot(),
          ),
        { message: "adapter is required" },
      );
    });

    test("throws error when bot is not provided", () => {
      assert.throws(
        () =>
          new TeamsServer(
            createMockConfig(),
            createMockTenantClientService(),
            createMockHtmlRenderer(),
            createMockAdapter(),
            null,
          ),
        { message: "bot is required" },
      );
    });

    test("creates server instance with valid dependencies", () => {
      const server = new TeamsServer(
        createMockConfig(),
        createMockTenantClientService(),
        createMockHtmlRenderer(),
        createMockAdapter(),
        createMockBot(),
      );

      assert.ok(server);
      assert.ok(server.server);
      assert.strictEqual(typeof server.listen, "function");
      assert.strictEqual(typeof server.close, "function");
    });
  });

  describe("routes", () => {
    let teamsServer;

    beforeEach(() => {
      teamsServer = new TeamsServer(
        createMockConfig(),
        createMockTenantClientService(),
        createMockHtmlRenderer(),
        createMockAdapter(),
        createMockBot(),
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

    test("serves /main.css with text/css content type", async () => {
      const req = createMockRequest({ method: "GET", url: "/main.css" });
      const res = createMockResponse();

      const requestHandler = teamsServer.server.listeners("request")[0];
      await requestHandler(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers["Content-Type"], "text/css");
    });

    test("serves /settings.js with application/javascript content type", async () => {
      const req = createMockRequest({ method: "GET", url: "/settings.js" });
      const res = createMockResponse();

      const requestHandler = teamsServer.server.listeners("request")[0];
      await requestHandler(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers["Content-Type"], "application/javascript");
    });

    test("serves /about with text/html content type", async () => {
      const req = createMockRequest({ method: "GET", url: "/about" });
      const res = createMockResponse();

      const requestHandler = teamsServer.server.listeners("request")[0];
      await requestHandler(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers["Content-Type"], "text/html");
    });

    test("serves /messages with text/html content type", async () => {
      const req = createMockRequest({ method: "GET", url: "/messages" });
      const res = createMockResponse();

      const requestHandler = teamsServer.server.listeners("request")[0];
      await requestHandler(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers["Content-Type"], "text/html");
    });

    test("serves /settings with text/html content type", async () => {
      const req = createMockRequest({ method: "GET", url: "/settings" });
      const res = createMockResponse();

      const requestHandler = teamsServer.server.listeners("request")[0];
      await requestHandler(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers["Content-Type"], "text/html");
    });

    test("returns 404 for POST on static routes", async () => {
      const req = createMockRequest({ method: "POST", url: "/about" });
      const res = createMockResponse();

      const requestHandler = teamsServer.server.listeners("request")[0];
      await requestHandler(req, res);

      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.body, "Not found");
    });
  });
});
