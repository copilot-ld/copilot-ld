/* eslint-env node */
import { test, describe, mock } from "node:test";
import assert from "node:assert";

import { Evaluator } from "../index.js";

/**
 * Mock stream generator
 * @param {any} data - The data to yield
 * @yields {any} The data
 */
async function* mockStream(data) {
  yield data;
}

describe("Evaluator", () => {
  test("constructor validates required dependencies", () => {
    const mockAgent = {};
    const mockTrace = {};
    const mockToken = "test-token";
    const mockModel = null;
    const mockIndex = {};
    const mockCriteria = {};
    const mockRetrieval = {};
    const mockTraceEval = {};

    assert.throws(
      () =>
        new Evaluator(
          null,
          mockTrace,
          mockToken,
          mockModel,
          mockIndex,
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
          mockToken,
          mockModel,
          mockIndex,
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
          mockTrace,
          null,
          mockModel,
          mockIndex,
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
          mockTrace,
          mockToken,
          mockModel,
          null,
          mockCriteria,
          mockRetrieval,
          mockTraceEval,
        ),
      /evaluationIndex is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockTrace,
          mockToken,
          mockModel,
          mockIndex,
          null,
          mockRetrieval,
          mockTraceEval,
        ),
      /judgeEvaluator is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockTrace,
          mockToken,
          mockModel,
          mockIndex,
          mockCriteria,
          null,
          mockTraceEval,
        ),
      /recallEvaluator is required/,
    );

    assert.throws(
      () =>
        new Evaluator(
          mockAgent,
          mockTrace,
          mockToken,
          mockModel,
          mockIndex,
          mockCriteria,
          mockRetrieval,
          null,
        ),
      /traceEvaluator is required/,
    );
  });

  test("constructor creates evaluator with all dependencies", () => {
    const mockAgent = {};
    const mockTrace = {};
    const mockToken = "test-token";
    const mockModel = null;
    const mockIndex = {};
    const mockCriteria = {};
    const mockRetrieval = {};
    const mockTraceEval = {};

    const evaluator = new Evaluator(
      mockAgent,
      mockTrace,
      mockToken,
      mockModel,
      mockIndex,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    assert.ok(evaluator instanceof Evaluator);
  });

  test("evaluate throws error for invalid scenario type", async () => {
    const mockAgent = {
      ProcessStream: mock.fn(() =>
        mockStream({
          resource_id: "test-123",
          choices: [{ message: { content: { text: "Response" } } }],
        }),
      ),
    };
    const mockTrace = {};
    const mockToken = "test-token";
    const mockModel = null;
    const mockIndex = { add: mock.fn(() => Promise.resolve()) };
    const mockCriteria = {};
    const mockRetrieval = {};
    const mockTraceEval = {};

    const evaluator = new Evaluator(
      mockAgent,
      mockTrace,
      mockToken,
      mockModel,
      mockIndex,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    await assert.rejects(
      async () =>
        await evaluator.evaluate({
          name: "test",
          type: "invalid",
          prompt: "Test",
        }),
      /unknown type: invalid/,
    );
  });
  test("evaluate processes single scenario successfully", async () => {
    const mockResponse = {
      resource_id: "test-resource-123",
      choices: [
        {
          message: {
            content: { text: "This is a test response" },
          },
        },
      ],
    };

    const mockAgent = {
      ProcessStream: mock.fn(() => mockStream(mockResponse)),
    };

    const mockTrace = {};

    const mockCriteriaResult = {
      scenario: "test-1",
      type: "judge",
      passed: true,
      judgment: "PASS: Response meets all criteria",
      prompt: "What is the meaning of life?",
      response: "This is a test response",
    };

    const mockCriteria = {
      evaluate: mock.fn(() => Promise.resolve(mockCriteriaResult)),
    };

    const mockRetrieval = {};
    const mockTraceEval = {};
    const mockToken = "test-token";
    const mockModel = null;
    const mockIndex = { add: mock.fn(() => Promise.resolve()) };

    const evaluator = new Evaluator(
      mockAgent,
      mockTrace,
      mockToken,
      mockModel,
      mockIndex,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    const scenario = {
      name: "test-1",
      type: "judge",
      prompt: "What is the meaning of life?",
      evaluations: [
        {
          label: "Verifies response is helpful and accurate",
          data: "Response should be helpful and accurate",
        },
      ],
    };

    const result = await evaluator.evaluate(scenario);

    assert.strictEqual(mockAgent.ProcessStream.mock.callCount(), 1);
    assert.strictEqual(mockCriteria.evaluate.mock.callCount(), 1);

    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.scenario, "test-1");
  });

  test("evaluate processes multiple scenarios with concurrency", async () => {
    const mockResponse = {
      resource_id: "test-resource-123",
      choices: [
        {
          message: {
            content: { text: "Test response" },
          },
        },
      ],
    };

    const mockAgent = {
      ProcessStream: mock.fn(() => mockStream(mockResponse)),
    };

    const mockTrace = {};

    const mockCriteriaResult = {
      scenario: "test-1",
      type: "judge",
      passed: true,
      judgment: "PASS",
      prompt: "Query",
      response: "Test response",
    };

    const mockCriteria = {
      evaluate: mock.fn(() => Promise.resolve(mockCriteriaResult)),
    };

    const mockRetrieval = {};
    const mockTraceEval = {};
    const mockToken = "test-token";
    const mockModel = null;
    const mockIndex = { add: mock.fn(() => Promise.resolve()) };

    const evaluator = new Evaluator(
      mockAgent,
      mockTrace,
      mockToken,
      mockModel,
      mockIndex,
      mockCriteria,
      mockRetrieval,
      mockTraceEval,
    );

    const scenarios = [
      {
        name: "test-1",
        type: "judge",
        prompt: "Query 1",
        evaluations: [
          {
            label: "Verifies response is helpful",
            data: "Should be helpful",
          },
        ],
      },
      {
        name: "test-2",
        type: "judge",
        prompt: "Query 2",
        evaluations: [
          {
            label: "Verifies response is accurate",
            data: "Should be accurate",
          },
        ],
      },
      {
        name: "test-3",
        type: "judge",
        prompt: "Query 3",
        evaluations: [
          {
            label: "Verifies response is complete",
            data: "Should be complete",
          },
        ],
      },
    ];

    const results = await Promise.all(
      scenarios.map((scenario) => evaluator.evaluate(scenario)),
    );

    assert.strictEqual(mockAgent.ProcessStream.mock.callCount(), 3);
    assert.strictEqual(mockCriteria.evaluate.mock.callCount(), 3);
    assert.strictEqual(results.length, 3);
  });
});
