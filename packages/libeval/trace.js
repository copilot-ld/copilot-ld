/* eslint-env node */
import { trace } from "@copilot-ld/libtype";

/**
 * Trace-based evaluator using JMESPath expressions
 * Evaluates agent responses by analyzing trace data with JMESPath queries
 */
export class TraceEvaluator {
  #traceClient;

  /**
   * Create a new TraceEvaluator instance
   * @param {import('@copilot-ld/librpc').TraceClient} traceClient - Trace client for retrieving spans
   */
  constructor(traceClient) {
    if (!traceClient) throw new Error("traceClient is required");

    this.#traceClient = traceClient;
  }

  /**
   * Execute a single JMESPath evaluation
   * @param {object} evaluation - Evaluation with label and data (JMESPath query)
   * @param {string} resourceId - Resource ID to filter traces
   * @returns {Promise<object>} Evaluation result with passed status
   */
  async #executeEvaluation(evaluation, resourceId) {
    const jmespathQuery = evaluation.data;
    const queryRequest = trace.QueryRequest.fromObject({
      query: jmespathQuery,
      filter: { resource_id: resourceId },
    });

    const result = await this.#traceClient.QuerySpans(queryRequest);

    // Count unique traces (not spans) that matched
    const uniqueTraceIds = new Set(
      result.spans?.map((span) => span.trace_id) || [],
    );
    const count = uniqueTraceIds.size;
    const passed = count > 0;

    return {
      label: evaluation.label,
      data: jmespathQuery,
      passed,
      count,
    };
  }

  /**
   * Evaluate traces with JMESPath expressions
   * @param {object} scenario - Scenario with evaluations array containing JMESPath queries
   * @param {string} resourceId - Resource ID from agent response
   * @returns {Promise<object>} Evaluation result with passed and evaluations
   */
  async evaluate(scenario, resourceId) {
    if (!scenario.evaluations || scenario.evaluations.length === 0) {
      throw new Error(`Scenario ${scenario.name} missing evaluations`);
    }

    // Execute JMESPath checks by querying the trace service
    const evaluationResults = await Promise.all(
      scenario.evaluations.map((evaluation) =>
        this.#executeEvaluation(evaluation, resourceId),
      ),
    );

    const passed = evaluationResults.every((r) => r.passed);

    return {
      passed,
      evaluations: evaluationResults,
    };
  }
}
