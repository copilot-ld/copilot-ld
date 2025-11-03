/* eslint-env node */
import { test, describe, mock } from "node:test";
import assert from "node:assert";

import { Evaluator, EvaluationResult } from "../index.js";

describe("Evaluator", () => {
  test("constructor validates required dependencies", () => {
    const mockAgent = {};
    const mockMemory = {};
    const mockTrace = {};
    const mockToken = "test-token";
    const mockCriteria = {};
    const mockRetrieval = {};
    const mockTraceEval = {};

    assert.throws(
      () =>
        new Evaluator(
          null,
          mockMemory,
          mockTrace,
          mockToken,
          mockCriteria,
          mockRetrieval,
          mockTraceEval,
        ),
      /agentClient is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          null,
          mockTrace,
          mockToken,
          mockCriteria,
          mockRetrieval,
          mockTraceEval,
        ),
      /memoryClient is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockMemory,
          null,
          mockToken,
          mockCriteria,
          mockRetrieval,
          mockTraceEval,
        ),
      /traceClient is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockMemory,
          mockTrace,
          null,
          mockCriteria,
          mockRetrieval,
          mockTraceEval,
        ),
      /githubToken is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockMemory,
          mockTrace,
          mockToken,
          null,
          mockRetrieval,
          mockTraceEval,
        ),
      /criteriaEvaluator is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockMemory,
          mockTrace,
          mockToken,
          mockCriteria,
          null,
          mockTraceEval,
        ),
      /retrievalEvaluator is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockMemory,
          mockTrace,
          mockToken,
          mockCriteria,
          mockRetrieval,
          null,
        ),
      /traceEvaluator is required/,
    );
  });

  test("constructor creates evaluator with all dependencies", () => {
    const mockAgent = {};
    const mockMemory = {};
    const mockTrace = {};
    const mockToken = "test-token";
    const mockCriteria = {};
    const mockRetrieval = {};
    const mockTraceEval = {};

    const evaluator = new Evaluator(
      mockAgent,
      mockMemory,
      mockTrace,
      mockToken,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    assert.ok(evaluator instanceof Evaluator);
  });

  test("evaluate throws error for empty test cases", async () => {
    const mockAgent = {};
    const mockMemory = {};
    const mockTrace = {};
    const mockToken = "test-token";
    const mockCriteria = {};
    const mockRetrieval = {};
    const mockTraceEval = {};

    const evaluator = new Evaluator(
      mockAgent,
      mockMemory,
      mockTrace,
      mockToken,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    await assert.rejects(
      async () => await evaluator.evaluate([]),
      /testCases array is required/,
    );
  });

  test("evaluate processes single criteria test case successfully", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: { text: "This is a test response" },
          },
        },
      ],
      resource_id: "conv-123",
    };

    const mockAgent = {
      ProcessRequest: mock.fn(() => Promise.resolve(mockResponse)),
    };

    const mockResult = new EvaluationResult(
      "test-1",
      "criteria",
      true,
      "Test query",
      "conv-123",
      { judgment: "PASS" },
    );

    const mockCriteria = {
      evaluate: mock.fn(() => Promise.resolve(mockResult)),
    };

    const mockMemory = {};
    const mockTrace = {};
    const mockRetrieval = {};
    const mockTraceEval = {};
    const mockToken = "test-token";

    const evaluator = new Evaluator(
      mockAgent,
      mockMemory,
      mockTrace,
      mockToken,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    const testCases = [
      {
        id: "test-1",
        query: "What is the meaning of life?",
        criteria: "Response must be meaningful",
      },
    ];

    const results = await evaluator.evaluate(testCases, 1);

    assert.strictEqual(mockAgent.ProcessRequest.mock.callCount(), 1);
    assert.strictEqual(mockCriteria.evaluate.mock.callCount(), 1);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].passed, true);
  });

  test("evaluate processes multiple test cases with concurrency", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: { text: "Test response" },
          },
        },
      ],
      resource_id: "conv-123",
    };

    const mockAgent = {
      ProcessRequest: mock.fn(() => Promise.resolve(mockResponse)),
    };

    const mockResult = new EvaluationResult(
      "test-1",
      "criteria",
      true,
      "Test query",
      "conv-123",
      { judgment: "PASS" },
    );

    const mockCriteria = {
      evaluate: mock.fn(() => Promise.resolve(mockResult)),
    };

    const mockMemory = {};
    const mockTrace = {};
    const mockRetrieval = {};
    const mockTraceEval = {};
    const mockToken = "test-token";

    const evaluator = new Evaluator(
      mockAgent,
      mockMemory,
      mockTrace,
      mockToken,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    const testCases = [
      {
        id: "test-1",
        query: "Query 1",
        criteria: "Test criteria",
      },
      {
        id: "test-2",
        query: "Query 2",
        criteria: "Test criteria",
      },
      {
        id: "test-3",
        query: "Query 3",
        criteria: "Test criteria",
      },
    ];

    const results = await evaluator.evaluate(testCases, 2);

    assert.strictEqual(mockAgent.ProcessRequest.mock.callCount(), 3);
    assert.strictEqual(mockCriteria.evaluate.mock.callCount(), 3);
    assert.strictEqual(results.length, 3);
  });
});

describe("EvaluationResult", () => {
  test("constructor validates required fields", () => {
    assert.throws(
      () => new EvaluationResult(null, "criteria", true, "query", "conv-1", {}),
      /caseId is required/,
    );

    assert.throws(
      () => new EvaluationResult("test-1", null, true, "query", "conv-1", {}),
      /type is required/,
    );

    assert.throws(
      () =>
        new EvaluationResult("test-1", "criteria", undefined, "query", "conv-1", {}),
      /passed is required/,
    );

    assert.throws(
      () => new EvaluationResult("test-1", "criteria", true, null, "conv-1", {}),
      /query is required/,
    );

    assert.throws(
      () =>
        new EvaluationResult("test-1", "criteria", true, "query", "conv-1", null),
      /details is required/,
    );
  });

  test("getters return correct values", () => {
    const result = new EvaluationResult(
      "test-1",
      "criteria",
      true,
      "Test query",
      "conv-123",
      { judgment: "PASS" },
    );

    assert.strictEqual(result.caseId, "test-1");
    assert.strictEqual(result.type, "criteria");
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.query, "Test query");
    assert.strictEqual(result.conversationId, "conv-123");
    assert.deepStrictEqual(result.details, { judgment: "PASS" });
  });

  test("toJSON includes all fields", () => {
    const result = new EvaluationResult(
      "test-1",
      "criteria",
      true,
      "Test query",
      "conv-123",
      { judgment: "PASS", extra: "data" },
    );

    const json = result.toJSON();

    assert.strictEqual(json.caseId, "test-1");
    assert.strictEqual(json.type, "criteria");
    assert.strictEqual(json.passed, true);
    assert.strictEqual(json.query, "Test query");
    assert.strictEqual(json.conversationId, "conv-123");
    assert.strictEqual(json.judgment, "PASS");
    assert.strictEqual(json.extra, "data");
  });
});
