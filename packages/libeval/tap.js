/* eslint-env node */

/**
 * @typedef {import('./result.js').EvaluationResult} EvaluationResult
 */

/**
 * @typedef {object} ReporterInterface
 * @property {(results: EvaluationResult[], storage: object) => Promise<void>} generate - Generate report from evaluation results
 */

/**
 * TAP (Test Anything Protocol) format reporter
 * Generates test output in TAP format for CI/CD integration
 */
export class TapReporter {
  /**
   * Generate TAP format report from evaluation results
   * @param {EvaluationResult[]} results - Array of evaluation results
   * @param {object} storage - Storage instance for writing reports
   * @returns {Promise<void>} Resolves when report is written
   */
  async generate(results, storage) {
    const timestamp = new Date().toISOString().split("T")[0];
    const runId = `run-${timestamp}-${Date.now().toString().slice(-3)}`;

    let tap = `TAP version 13\n`;
    tap += `1..${results.length}\n`;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const testNumber = i + 1;

      if (result.passed) {
        tap += `ok ${testNumber} - ${result.caseId} (${result.type})\n`;
      } else {
        tap += `not ok ${testNumber} - ${result.caseId} (${result.type})\n`;
        tap += `  ---\n`;
        tap += `  query: "${result.query}"\n`;

        if (result.conversationId) {
          tap += `  conversation_id: "${result.conversationId}"\n`;
          tap += `  memory: "data/memories/${result.conversationId}.jsonl"\n`;
          tap += `  resources: "data/resources/${result.conversationId}/"\n`;
          tap += `  trace_query: "jq 'select(.resource_id == \\"${result.conversationId}\\")' data/traces/*.jsonl"\n`;
        }

        // Add type-specific failure details
        const details = result.details;
        if (result.type === "criteria" && details.judgment) {
          tap += `  judgment: "${details.judgment.replace(/\n/g, "\\n")}"\n`;
        } else if (result.type === "retrieval" && details.metrics) {
          tap += `  recall: ${(details.metrics.recall.value * 100).toFixed(1)}%\n`;
          tap += `  precision: ${(details.metrics.precision.value * 100).toFixed(1)}%\n`;
        } else if (result.type === "trace" && details.checks) {
          tap += `  failed_checks:\n`;
          for (const check of details.checks.filter((c) => !c.passed)) {
            tap += `    - "${check.command}"\n`;
          }
        }

        tap += `  ...\n`;
      }
    }

    await storage.put(`${runId}.tap`, tap);
    console.log(`TAP report written to: data/eval/${runId}.tap`);
  }
}
