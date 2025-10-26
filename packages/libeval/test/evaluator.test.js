/* eslint-env node */
import { test, describe, mock } from "node:test";
import assert from "node:assert";

import { Evaluator } from "../index.js";

describe("Evaluator", () => {
  test("constructor validates required dependencies", () => {
    const mockAgent = {};
    const mockToken = "test-token";
    const mockJudge = {};
    const mockMetrics = {};
    const mockReporter = {};

    assert.throws(
      () =>
        new Evaluator(null, mockToken, mockJudge, mockMetrics, mockReporter),
      /agentClient is required/,
    );

    assert.throws(
      () =>
        new Evaluator(mockAgent, null, mockJudge, mockMetrics, mockReporter),
      /githubToken is required/,
    );

    assert.throws(
      () =>
        new Evaluator(mockAgent, mockToken, null, mockMetrics, mockReporter),
      /judge is required/,
    );

    assert.throws(
      () => new Evaluator(mockAgent, mockToken, mockJudge, null, mockReporter),
      /metrics is required/,
    );

    assert.throws(
      () => new Evaluator(mockAgent, mockToken, mockJudge, mockMetrics, null),
      /reporter is required/,
    );
  });

  test("constructor creates evaluator with all dependencies", () => {
    const mockAgent = {};
    const mockToken = "test-token";
    const mockJudge = {};
    const mockMetrics = {};
    const mockReporter = {};

    const evaluator = new Evaluator(
      mockAgent,
      mockToken,
      mockJudge,
      mockMetrics,
      mockReporter,
    );

    assert.ok(evaluator instanceof Evaluator);
  });

  test("evaluate throws error for empty test cases", async () => {
    const mockAgent = {};
    const mockToken = "test-token";
    const mockJudge = {};
    const mockMetrics = {};
    const mockReporter = {};

    const evaluator = new Evaluator(
      mockAgent,
      mockToken,
      mockJudge,
      mockMetrics,
      mockReporter,
    );

    await assert.rejects(
      async () => await evaluator.evaluate([]),
      /testCases array is required/,
    );
  });

  test("evaluate processes single test case successfully", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: { text: "This is a test response" },
          },
        },
      ],
    };

    const mockAgent = {
      ProcessRequest: mock.fn(() => Promise.resolve(mockResponse)),
    };

    const mockScores = {
      relevance: 8,
      accuracy: 9,
      completeness: 7,
      coherence: 8,
      sourceAttribution: 6,
      average: 7.6,
    };

    const mockJudge = {
      evaluateAll: mock.fn(() => Promise.resolve(mockScores)),
    };

    const mockAggregatedResults = {
      totalCases: 1,
      averageScores: mockScores,
      results: [],
    };

    const mockMetrics = {
      aggregate: mock.fn(() => mockAggregatedResults),
    };

    const mockReporter = {};
    const mockToken = "test-token";

    const evaluator = new Evaluator(
      mockAgent,
      mockToken,
      mockJudge,
      mockMetrics,
      mockReporter,
    );

    const testCases = [
      {
        id: "test-1",
        query: "What is the meaning of life?",
        groundTruth: "42",
        expectedTopics: ["philosophy", "humor"],
      },
    ];

    const results = await evaluator.evaluate(testCases, 1);

    assert.strictEqual(mockAgent.ProcessRequest.mock.callCount(), 1);
    assert.strictEqual(mockJudge.evaluateAll.mock.callCount(), 1);
    assert.strictEqual(mockMetrics.aggregate.mock.callCount(), 1);
    assert.strictEqual(results.totalCases, 1);
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
    };

    const mockAgent = {
      ProcessRequest: mock.fn(() => Promise.resolve(mockResponse)),
    };

    const mockScores = {
      relevance: 8,
      accuracy: 9,
      completeness: 7,
      coherence: 8,
      sourceAttribution: 6,
      average: 7.6,
    };

    const mockJudge = {
      evaluateAll: mock.fn(() => Promise.resolve(mockScores)),
    };

    const mockAggregatedResults = {
      totalCases: 3,
      averageScores: mockScores,
      results: [],
    };

    const mockMetrics = {
      aggregate: mock.fn(() => mockAggregatedResults),
    };

    const mockReporter = {};
    const mockToken = "test-token";

    const evaluator = new Evaluator(
      mockAgent,
      mockToken,
      mockJudge,
      mockMetrics,
      mockReporter,
    );

    const testCases = [
      {
        id: "test-1",
        query: "Query 1",
        groundTruth: "Answer 1",
        expectedTopics: [],
      },
      {
        id: "test-2",
        query: "Query 2",
        groundTruth: "Answer 2",
        expectedTopics: [],
      },
      {
        id: "test-3",
        query: "Query 3",
        groundTruth: "Answer 3",
        expectedTopics: [],
      },
    ];

    const results = await evaluator.evaluate(testCases, 2);

    assert.strictEqual(mockAgent.ProcessRequest.mock.callCount(), 3);
    assert.strictEqual(mockJudge.evaluateAll.mock.callCount(), 3);
    assert.strictEqual(mockMetrics.aggregate.mock.callCount(), 1);
    assert.strictEqual(results.totalCases, 3);
  });

  test("report generates markdown and JSON reports", async () => {
    const mockReporter = {
      generateMarkdown: mock.fn(() => Promise.resolve()),
      generateJSON: mock.fn(() => Promise.resolve()),
    };

    const mockAgent = {};
    const mockToken = "test-token";
    const mockJudge = {};
    const mockMetrics = {};

    const evaluator = new Evaluator(
      mockAgent,
      mockToken,
      mockJudge,
      mockMetrics,
      mockReporter,
    );

    const mockResults = {
      totalCases: 1,
      averageScores: {},
      results: [],
    };

    const mockStorage = {};

    await evaluator.report(mockResults, mockStorage);

    assert.strictEqual(mockReporter.generateMarkdown.mock.callCount(), 1);
    assert.strictEqual(mockReporter.generateJSON.mock.callCount(), 1);
  });
});
