/* eslint-env node */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { trace } from "@copilot-ld/libtype";

const execAsync = promisify(exec);

/**
 * Trace-based evaluator using jq command execution
 * Evaluates agent responses by analyzing trace data with jq queries
 */
export class TraceEvaluator {
  #traceClient;
  #storage;

  /**
   * Create a new TraceEvaluator instance
   * @param {import('@copilot-ld/librpc').TraceClient} traceClient - Trace client for retrieving spans
   * @param {object} storage - Storage instance for temp files
   */
  constructor(traceClient, storage) {
    if (!traceClient) throw new Error("traceClient is required");
    if (!storage) throw new Error("storage is required");

    this.#traceClient = traceClient;
    this.#storage = storage;
  }

  /**
   * Evaluate traces with jq commands
   * @param {object} testCase - Test case with trace_checks
   * @param {string} resourceId - Resource ID from agent response
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(testCase, resourceId) {
    if (!testCase.trace_checks) {
      throw new Error(`Test case ${testCase.id} missing trace_checks`);
    }

    // Query traces for this resource_id
    const queryRequest = trace.QuerySpansRequest.fromObject({
      resource_id: resourceId,
      limit: 1000,
    });
    const traces = await this.#traceClient.QuerySpans(queryRequest);

    // Write traces to temp file for jq processing
    const tracesJson = JSON.stringify(traces, null, 2);
    const tempFile = `/tmp/traces-${resourceId}.json`;
    await this.#storage.put(tempFile, tracesJson);

    // Execute jq checks
    const checkResults = [];
    for (const jqCommand of testCase.trace_checks) {
      const { stdout, stderr } = await this.#executeJq(tempFile, jqCommand);

      checkResults.push({
        command: jqCommand,
        passed: stdout.trim().length > 0 && stderr.trim().length === 0,
        output: stdout,
        error: stderr,
      });
    }

    const passed = checkResults.every((r) => r.passed);

    return {
      caseId: testCase.id,
      type: "trace",
      passed,
      checks: checkResults,
      query: testCase.query,
      traceCount: traces.spans?.length || 0,
    };
  }

  /**
   * Execute jq command on file
   * @param {string} file - Path to JSON file
   * @param {string} command - jq command to execute
   * @returns {Promise<object>} stdout and stderr
   */
  async #executeJq(file, command) {
    try {
      const { stdout, stderr } = await execAsync(`jq '${command}' ${file}`);
      return { stdout, stderr };
    } catch (error) {
      return { stdout: "", stderr: error.message };
    }
  }
}
