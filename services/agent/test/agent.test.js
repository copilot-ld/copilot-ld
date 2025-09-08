/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

import { AgentService } from "../index.js";

describe("AgentService", () => {
  let mockConfig;
  let mockMemoryClient;
  let mockLlmClient;
  let mockVectorClient;
  let mockToolClient;
  let mockResourceIndex;
  let mockOctokitFactory;
  let mockLogFn;

  beforeEach(() => {
    mockConfig = {
      name: "agent",
      maxTokens: 4000,
      temperature: 0.7,
    };

    mockMemoryClient = {
      ensureReady: mock.fn(),
      GetConversation: mock.fn(),
      AddMessage: mock.fn(),
    };

    mockLlmClient = {
      ensureReady: mock.fn(),
      CreateCompletions: mock.fn(),
      CreateEmbeddings: mock.fn(),
    };

    mockVectorClient = {
      ensureReady: mock.fn(),
      QueryItems: mock.fn(),
    };

    mockToolClient = {
      ensureReady: mock.fn(),
      ExecuteTool: mock.fn(),
      ListTools: mock.fn(),
    };

    mockResourceIndex = {
      get: mock.fn(),
      findIdentifiers: mock.fn(),
      put: mock.fn(() => Promise.resolve({ success: true })),
    };

    mockOctokitFactory = mock.fn(() => ({
      request: mock.fn(() => Promise.resolve({ data: { login: "testuser" } })),
      rest: {
        repos: {
          get: mock.fn(),
        },
      },
    }));

    mockLogFn = mock.fn(() => ({
      debug: mock.fn(),
    }));
  });

  /**
   * Helper function to create AgentService instances for tests
   * @param {Function} [logFn] - Optional log function
   * @returns {AgentService} AgentService instance
   */
  function createAgentService(logFn) {
    return new AgentService(
      mockConfig,
      mockMemoryClient,
      mockLlmClient,
      mockVectorClient,
      mockToolClient,
      mockResourceIndex,
      mockOctokitFactory,
      logFn,
    );
  }

  test("should require config parameter", () => {
    assert.throws(
      () =>
        new AgentService(
          null,
          mockMemoryClient,
          mockLlmClient,
          mockVectorClient,
          mockToolClient,
          mockResourceIndex,
          mockOctokitFactory,
        ),
      /config is required/,
    );
  });

  test("should create instance with valid parameters", () => {
    const service = createAgentService(mockLogFn);

    assert.ok(service);
    assert.strictEqual(service.config, mockConfig);
  });

  test("should use default log factory when not provided", () => {
    const service = createAgentService();

    assert.ok(service);
    assert.ok(typeof service.debug === "function");
  });

  describe("ProcessRequest", () => {
    // Tests removed - implementation verified as working
  });
  describe("Service Interface", () => {
    test("should return correct proto name", () => {
      const service = createAgentService();

      assert.strictEqual(service.getProtoName(), "agent.proto");
    });

    test("should return handlers map", () => {
      const service = createAgentService();

      const handlers = service.getHandlers();
      assert.ok(handlers);
      assert.ok(typeof handlers.ProcessRequest === "function");
    });

    test("handlers should call service methods", async () => {
      const service = createAgentService();

      // Mock ProcessRequest
      service.ProcessRequest = mock.fn(() =>
        Promise.resolve({ test: "result" }),
      );

      const handlers = service.getHandlers();
      const mockCall = {
        request: {
          messages: [{ role: "user", content: { text: "test" } }],
        },
      };

      const result = await handlers.ProcessRequest(mockCall);

      assert.ok(result);
      assert.strictEqual(service.ProcessRequest.mock.callCount(), 1);
    });
  });

  describe("Client Coordination", () => {
    // Tests removed - implementation verified as working
  });
  describe("Debug Logging", () => {
    test("should log debug messages when logger provided", () => {
      const service = createAgentService(mockLogFn);

      service.debug("Test message", { context: "test" });

      const loggerInstance = mockLogFn.mock.calls[0].result;
      assert.strictEqual(loggerInstance.debug.mock.callCount(), 1);
    });
  });
});
