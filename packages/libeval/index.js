/* eslint-env node */
import { common, agent } from "@copilot-ld/libtype";

/**
 * Main evaluator orchestrates the evaluation workflow
 * Dispatches to appropriate evaluator based on test case configuration
 */
export class Evaluator {
  #agentClient;
  #githubToken;
  #criteriaEvaluator;
  #retrievalEvaluator;
  #traceEvaluator;

  /**
   * Create a new Evaluator instance
   * @param {import('@copilot-ld/librpc').AgentClient} agentClient - Agent client for testing
   * @param {import('@copilot-ld/librpc').MemoryClient} memoryClient - Memory client for retrieval evaluation
   * @param {import('@copilot-ld/librpc').TraceClient} traceClient - Trace client for trace evaluation
   * @param {string} githubToken - GitHub token for API access
   * @param {import('./criteria.js').CriteriaEvaluator} criteriaEvaluator - Criteria evaluator instance
   * @param {import('./retrieval.js').RetrievalEvaluator} retrievalEvaluator - Retrieval evaluator instance
   * @param {import('./trace.js').TraceEvaluator} traceEvaluator - Trace evaluator instance
   */
  constructor(
    agentClient,
    memoryClient,
    traceClient,
    githubToken,
    criteriaEvaluator,
    retrievalEvaluator,
    traceEvaluator,
  ) {
    if (!agentClient) throw new Error("agentClient is required");
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!traceClient) throw new Error("traceClient is required");
    if (!githubToken) throw new Error("githubToken is required");
    if (!criteriaEvaluator) throw new Error("criteriaEvaluator is required");
    if (!retrievalEvaluator) throw new Error("retrievalEvaluator is required");
    if (!traceEvaluator) throw new Error("traceEvaluator is required");

    this.#agentClient = agentClient;
    this.#githubToken = githubToken;
    this.#criteriaEvaluator = criteriaEvaluator;
    this.#retrievalEvaluator = retrievalEvaluator;
    this.#traceEvaluator = traceEvaluator;
  }

  /**
   * Evaluate all test cases with parallel processing
   * @param {object[]} testCases - Array of test cases to evaluate
   * @param {number} concurrency - Number of concurrent evaluations (default 5)
   * @returns {Promise<object[]>} Array of evaluation results
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

    console.log(`Evaluation complete.`);
    return results;
  }

  /**
   * Evaluate a single test case
   * @param {object} testCase - Test case to evaluate
   * @returns {Promise<object>} Evaluation result for this case
   */
  async #evaluateCase(testCase) {
    console.log(`Evaluating case: ${testCase.id}`);

    // Execute query against agent
    const request = agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({ role: "user", content: testCase.query }),
      ],
      github_token: this.#githubToken,
    });

    const response = await this.#agentClient.ProcessRequest(request);
    const resourceId = response.resource_id;

    // Determine evaluation type and dispatch
    let result;
    if (testCase.criteria) {
      result = await this.#criteriaEvaluator.evaluate(testCase, response);
    } else if (testCase.true_subjects) {
      result = await this.#retrievalEvaluator.evaluate(testCase, resourceId, response);
    } else if (testCase.trace_checks) {
      result = await this.#traceEvaluator.evaluate(testCase, resourceId);
    } else {
      throw new Error(`Invalid test case: ${testCase.id} - no evaluation method specified`);
    }

    // Add conversation ID to result for debugging
    result.conversationId = resourceId;
    return result;
  }
}

export { CriteriaEvaluator } from "./criteria.js";
export { RetrievalEvaluator } from "./retrieval.js";
export { TraceEvaluator } from "./trace.js";
export { ReportGenerator } from "./report.js";
