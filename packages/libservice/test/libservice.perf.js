/* eslint-env node */
import { test, describe } from "node:test";
import crypto from "crypto";

import { HmacAuth, Interceptor } from "../index.js";
import { createPerformanceTest } from "../../libperf/index.js";

describe("LibService Performance Tests", () => {
  // Test setup helpers
  const TEST_SECRET = crypto.randomBytes(32).toString("hex");
  const TEST_SERVICE_ID = "test-service";

  /**
   * Generate multiple test tokens for batch operations
   * @param {number} count - Number of tokens to generate
   * @returns {string[]} Array of generated tokens
   */
  function generateTestTokens(count) {
    const authenticator = new HmacAuth(TEST_SECRET);
    const tokens = [];
    for (let i = 0; i < count; i++) {
      tokens.push(authenticator.generateToken(`service-${i}`));
    }
    return tokens;
  }

  test(
    "HmacAuth.generateToken",
    createPerformanceTest({
      count: [100, 500, 1000],
      setupFn: () => {
        return new HmacAuth(TEST_SECRET);
      },
      testFn: (authenticator) => {
        authenticator.generateToken(
          `service-${Math.floor(Math.random() * 1000)}`,
        );
      },
      constraints: {
        maxDuration: 8,
        maxMemory: 200,
        scaling: "linear",
        tolerance: 2.0,
      },
    }),
  );

  test(
    "HmacAuth.verifyToken",
    createPerformanceTest({
      count: [100, 500, 1000],
      setupFn: (count) => {
        const authenticator = new HmacAuth(TEST_SECRET);
        const tokens = generateTestTokens(count);
        return { authenticator, tokens };
      },
      testFn: ({ authenticator, tokens }) => {
        const tokenIndex = Math.floor(Math.random() * tokens.length);
        authenticator.verifyToken(tokens[tokenIndex]);
      },
      constraints: {
        maxDuration: 12,
        maxMemory: 250,
        scaling: "linear",
        tolerance: 2.5,
      },
    }),
  );

  test(
    "Interceptor.validateCall",
    createPerformanceTest({
      count: [100, 500, 1000],
      setupFn: (count) => {
        const authenticator = new HmacAuth(TEST_SECRET);
        const interceptor = new Interceptor(authenticator, TEST_SERVICE_ID);
        const tokens = generateTestTokens(count);

        // Create mock call objects with metadata
        const calls = tokens.map((token) => ({
          metadata: {
            get: (key) => (key === "authorization" ? [`Bearer ${token}`] : []),
          },
        }));

        return { interceptor, calls };
      },
      testFn: ({ interceptor, calls }) => {
        const callIndex = Math.floor(Math.random() * calls.length);
        interceptor.validateCall(calls[callIndex]);
      },
      constraints: {
        maxDuration: 15,
        maxMemory: 300,
        scaling: "linear",
        tolerance: 2.5,
      },
    }),
  );

  test(
    "Authentication flow",
    createPerformanceTest({
      count: [50, 100, 200],
      setupFn: (count) => {
        const authenticator = new HmacAuth(TEST_SECRET);
        const interceptor = new Interceptor(authenticator, TEST_SERVICE_ID);

        // Pre-generate service IDs
        const serviceIds = Array.from(
          { length: count },
          (_, i) => `service-${i}`,
        );

        return { authenticator, interceptor, serviceIds };
      },
      testFn: ({ authenticator, interceptor, serviceIds }) => {
        const serviceId =
          serviceIds[Math.floor(Math.random() * serviceIds.length)];

        // Generate token
        const token = authenticator.generateToken(serviceId);

        // Create mock call with token
        const call = {
          metadata: {
            get: (key) => (key === "authorization" ? [`Bearer ${token}`] : []),
          },
        };

        // Validate the call
        interceptor.validateCall(call);
      },
      constraints: {
        maxDuration: 30,
        maxMemory: 800,
        scaling: "linear",
        tolerance: 3.0,
      },
    }),
  );

  test(
    "Authentication memory stability",
    createPerformanceTest({
      count: 1000,
      setupFn: (_count) => {
        const authenticator = new HmacAuth(TEST_SECRET);
        const interceptor = new Interceptor(authenticator, TEST_SERVICE_ID);

        // Pre-generate a pool of tokens to simulate realistic usage
        const tokenPool = Array.from({ length: 100 }, (_, i) =>
          authenticator.generateToken(`service-${i % 10}`),
        );

        return { interceptor, tokenPool };
      },
      testFn: ({ interceptor, tokenPool }) => {
        const token = tokenPool[Math.floor(Math.random() * tokenPool.length)];
        const call = {
          metadata: {
            get: (key) => (key === "authorization" ? [`Bearer ${token}`] : []),
          },
        };

        interceptor.validateCall(call);
      },
      constraints: {
        maxMemory: 1500,
      },
    }),
  );
});
