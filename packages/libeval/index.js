/* eslint-env node */
import { common, agent } from "@copilot-ld/libtype";

/**
 * Main evaluator orchestrates the evaluation workflow
 * Coordinates judge, metrics, and reporting
 */
export class Evaluator {
  #judge;
  #metrics;
  #reporter;
  #agentClient;
  #githubToken;

  /**
   * Create a new Evaluator instance
   * @param {import('@copilot-ld/librpc').AgentClient} agentClient - Agent client for testing
   * @param {string} githubToken - GitHub token for API access
   * @param {import('./judge.js').Judge} judge - Judge instance for evaluation
   * @param {import('./metrics.js').MetricsCalculator} metrics - Metrics calculator for aggregation
   * @param {import('./report.js').ReportGenerator} reporter - Report generator for output
   */
  constructor(agentClient, githubToken, judge, metrics, reporter) {
    if (!agentClient) throw new Error("agentClient is required");
    if (!githubToken) throw new Error("githubToken is required");
    if (!judge) throw new Error("judge is required");
    if (!metrics) throw new Error("metrics is required");
    if (!reporter) throw new Error("reporter is required");

    this.#agentClient = agentClient;
    this.#githubToken = githubToken;
    this.#judge = judge;
    this.#metrics = metrics;
    this.#reporter = reporter;
  }

  /**
   * Evaluate all test cases with parallel processing
   * @param {object[]} testCases - Array of test cases to evaluate
   * @param {number} concurrency - Number of concurrent evaluations (default 5)
   * @returns {Promise<object>} Aggregated evaluation results
   */
  async evaluate(testCases, concurrency = 5) {
    if (!testCases || testCases.length === 0) {
      throw new Error("testCases array is required");
    }

    console.log(
      `Starting evaluation of ${testCases.length} test cases with concurrency ${concurrency}`,
    );

    const results = [];

    // Process test cases in parallel batches
    for (let i = 0; i < testCases.length; i += concurrency) {
      const batch = testCases.slice(i, i + concurrency);
      console.log(
        `Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(testCases.length / concurrency)}`,
      );

      const batchResults = await Promise.all(
        batch.map((testCase) => this.#evaluateCase(testCase)),
      );
      results.push(...batchResults);
    }

    console.log(`Evaluation complete. Aggregating results...`);
    return this.#metrics.aggregate(results);
  }

  /**
   * Evaluate a single test case
   * @param {object} testCase - Test case to evaluate
   * @returns {Promise<object>} Evaluation result for this case
   */
  async #evaluateCase(testCase) {
    console.log(`Evaluating case: ${testCase.id}`);

    // Get agent response
    const request = agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({ role: "user", content: testCase.query }),
      ],
      github_token: this.#githubToken,
    });

    const response = await this.#agentClient.ProcessRequest(request);

    // Extract message content from first choice
    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices in agent response");
    }

    if (!response.choices[0].message?.content?.text) {
      throw new Error(
        `No content in agent response for test case: ${testCase.id}`,
      );
    }

    const responseContent = response.choices[0].message.content.text;

    // Evaluate with LLM judge
    const scores = await this.#judge.evaluateAll(
      testCase.query,
      responseContent,
      testCase.groundTruth,
      testCase.expectedTopics,
    );

    return {
      caseId: testCase.id,
      query: testCase.query,
      response: responseContent,
      scores,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate reports from evaluation results
   * @param {object} results - Aggregated evaluation results
   * @param {object} storage - Storage instance for output
   * @returns {Promise<void>} Resolves when reports are written
   */
  async report(results, storage) {
    console.log("Generating reports...");
    await Promise.all([
      this.#reporter.generateMarkdown(results, storage),
      this.#reporter.generateJSON(results, storage),
    ]);
  }
}

export { Judge } from "./judge.js";
export { MetricsCalculator } from "./metrics.js";
export { ReportGenerator } from "./report.js";
