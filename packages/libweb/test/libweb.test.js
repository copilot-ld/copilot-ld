import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { ExtensionConfig } from "@copilot-ld/libconfig";
import {
  RequestValidator,
  MemoryRateLimiter,
  SecurityMiddleware,
  AgentClient,
  createRateLimiter,
  createSecurityMiddleware,
} from "../index.js";

describe("RequestValidator", () => {
  let validator;

  beforeEach(() => {
    validator = new RequestValidator();
  });

  test("validates valid object", () => {
    const result = validator.validate({ message: "test" });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test("rejects null data", () => {
    const result = validator.validate(null);
    assert.strictEqual(result.isValid, false);
    assert(result.errors.length > 0);
  });

  test("rejects non-object data", () => {
    const result = validator.validate("string");
    assert.strictEqual(result.isValid, false);
    assert(result.errors.length > 0);
  });
});

describe("MemoryRateLimiter", () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new MemoryRateLimiter({ windowMs: 1000, maxRequests: 2 });
  });

  test("allows requests within limit", async () => {
    const result = await rateLimiter.checkLimit("test-key");
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, 1);
  });

  test("blocks requests exceeding limit", async () => {
    await rateLimiter.checkLimit("test-key");
    await rateLimiter.checkLimit("test-key");

    const result = await rateLimiter.checkLimit("test-key");
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.remaining, 0);
  });

  test("resets limit for key", async () => {
    await rateLimiter.checkLimit("test-key");
    await rateLimiter.checkLimit("test-key");

    await rateLimiter.reset("test-key");

    const result = await rateLimiter.checkLimit("test-key");
    assert.strictEqual(result.allowed, true);
  });

  test("disposes cleanup interval", () => {
    // Should not throw
    rateLimiter.dispose();

    // Multiple disposes should be safe
    rateLimiter.dispose();
  });
});

describe("SecurityMiddleware", () => {
  let securityMiddleware;
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new MemoryRateLimiter({ windowMs: 1000, maxRequests: 10 });
    securityMiddleware = new SecurityMiddleware(rateLimiter);
  });

  test("creates validation middleware", () => {
    const middleware = securityMiddleware.createValidationMiddleware({
      required: ["message"],
      types: { message: "string" },
    });

    assert.strictEqual(typeof middleware, "function");
  });

  test("creates rate limit middleware", () => {
    const middleware = securityMiddleware.createRateLimitMiddleware();
    assert.strictEqual(typeof middleware, "function");
  });

  test("creates CORS middleware", () => {
    const middleware = securityMiddleware.createCorsMiddleware();
    assert.strictEqual(typeof middleware, "function");
  });

  test("creates error middleware", () => {
    const middleware = securityMiddleware.createErrorMiddleware();
    assert.strictEqual(typeof middleware, "function");
  });
});

describe("AgentClient", () => {
  test("creates agent client wrapper", () => {
    const mockClient = {
      ProcessRequest: (params, callback) => callback(null, { success: true }),
    };

    const agentClient = new AgentClient(mockClient);
    assert(agentClient instanceof AgentClient);
  });

  test("processes request successfully", async () => {
    const mockClient = {
      ProcessRequest: (params, callback) => callback(null, { success: true }),
    };

    const agentClient = new AgentClient(mockClient);
    const result = await agentClient.processRequest({ test: true });

    assert.strictEqual(result.success, true);
  });

  test("handles request errors", async () => {
    const mockClient = {
      ProcessRequest: (params, callback) => callback(new Error("Test error")),
    };

    const agentClient = new AgentClient(mockClient);

    await assert.rejects(() => agentClient.processRequest({ test: true }), {
      message: "Test error",
    });
  });
});

describe("Factory functions", () => {
  test("createRateLimiter creates rate limiter", () => {
    const rateLimiter = createRateLimiter();
    assert(rateLimiter instanceof MemoryRateLimiter);
  });

  test("createSecurityMiddleware creates security middleware", () => {
    const config = new ExtensionConfig("test");
    const middleware = createSecurityMiddleware(config);
    assert(middleware instanceof SecurityMiddleware);
  });
});
