/* eslint-env node */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mustache from "mustache";

/**
 * @typedef {import('./result.js').EvaluationResult} EvaluationResult
 */

/**
 * Markdown format reporter using mustache templates
 * Generates detailed evaluation reports in markdown format
 */
export class MarkdownReporter {
  #templatePath;

  /**
   * Create a new MarkdownReporter instance
   * @param {string} templatePath - Optional custom template path
   */
  constructor(templatePath = null) {
    if (templatePath) {
      this.#templatePath = templatePath;
    } else {
      // Default to bundled template
      const currentDir = dirname(fileURLToPath(import.meta.url));
      this.#templatePath = join(currentDir, "templates", "results.md.mustache");
    }
  }

  /**
   * Generate markdown report from evaluation results
   * @param {EvaluationResult[]} results - Array of evaluation results
   * @param {object} storage - Storage instance for writing reports
   * @returns {Promise<void>} Resolves when report is written
   */
  async generate(results, storage) {
    const timestamp = new Date().toISOString();
    const runId = `run-${timestamp.split("T")[0]}-${Date.now().toString().slice(-3)}`;

    // Calculate summary statistics
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    const failedCount = totalCount - passedCount;
    const passRate = ((passedCount / totalCount) * 100).toFixed(1);

    // Group by type
    const typeGroups = this.#groupByType(results);

    // Prepare failed tests for debugging section
    const failedTests = results
      .filter((r) => !r.passed && r.conversationId)
      .map((r) => ({
        caseId: r.caseId,
        query: r.query,
        conversationId: r.conversationId,
      }));

    // Prepare detailed results
    const detailedResults = results.map((r) => this.#prepareResultData(r));

    // Template data
    const data = {
      runId,
      timestamp,
      totalCount,
      passedCount,
      failedCount,
      passRate,
      typeGroups,
      hasFailedTests: failedTests.length > 0,
      failedTests,
      results: detailedResults,
    };

    // Load and render template
    const template = await readFile(this.#templatePath, "utf8");
    const markdown = mustache.render(template, data);

    // Write reports
    await storage.put(`${runId}.md`, markdown);
    await storage.put(`${runId}.json`, JSON.stringify(results.map((r) => r.toJSON()), null, 2));

    console.log(`Markdown report written to: data/eval/${runId}.md`);
    console.log(`JSON report written to: data/eval/${runId}.json`);
  }

  /**
   * Group results by type with statistics
   * @param {EvaluationResult[]} results - Array of results
   * @returns {object[]} Type groups with statistics
   */
  #groupByType(results) {
    const types = ["criteria", "retrieval", "trace"];
    return types
      .map((type) => {
        const cases = results.filter((r) => r.type === type);
        if (cases.length === 0) return null;

        const passed = cases.filter((c) => c.passed).length;
        return {
          typeName: type.charAt(0).toUpperCase() + type.slice(1),
          count: cases.length,
          passed,
          failed: cases.length - passed,
        };
      })
      .filter(Boolean);
  }

  /**
   * Prepare result data for template
   * @param {EvaluationResult} result - Evaluation result
   * @returns {object} Template data
   */
  #prepareResultData(result) {
    const base = {
      caseId: result.caseId,
      type: result.type,
      query: result.query,
      conversationId: result.conversationId,
      status: result.passed ? "✅ PASS" : "❌ FAIL",
      statusIcon: result.passed ? "✅" : "❌",
      isCriteria: result.type === "criteria",
      isRetrieval: result.type === "retrieval",
      isTrace: result.type === "trace",
    };

    if (result.type === "criteria") {
      return this.#prepareCriteriaData(base, result);
    }

    if (result.type === "retrieval") {
      return this.#prepareRetrievalData(base, result);
    }

    if (result.type === "trace") {
      return this.#prepareTraceData(base, result);
    }

    return base;
  }

  /**
   * Prepare criteria-specific template data
   * @param {object} base - Base template data
   * @param {EvaluationResult} result - Evaluation result
   * @returns {object} Criteria template data
   */
  #prepareCriteriaData(base, result) {
    const details = result.details;
    return {
      ...base,
      judgment: details.judgment || "",
    };
  }

  /**
   * Prepare retrieval-specific template data
   * @param {object} base - Base template data
   * @param {EvaluationResult} result - Evaluation result
   * @returns {object} Retrieval template data
   */
  #prepareRetrievalData(base, result) {
    const details = result.details;
    const metrics = details.metrics || {};
    
    const recallData = this.#prepareRecallData(metrics.recall || {});
    const precisionData = this.#preparePrecisionData(metrics.precision || {});

    return {
      ...base,
      retrievedCount: details.retrievedCount || 0,
      uniqueCount: details.uniqueCount || 0,
      hasResponse: !!details.response,
      response: details.response || "",
      ...recallData,
      ...precisionData,
    };
  }

  /**
   * Prepare recall metric data
   * @param {object} recall - Recall metrics
   * @returns {object} Recall template data
   */
  #prepareRecallData(recall) {
    return {
      recallValue: ((recall.value || 0) * 100).toFixed(1),
      recallThreshold: ((recall.threshold || 0) * 100).toFixed(0),
      recallStatus: recall.passed ? "PASS" : "FAIL",
      foundCount: (recall.found || []).length,
      foundSubjects: recall.found || [],
      hasMissing: (recall.missing || []).length > 0,
      missingCount: (recall.missing || []).length,
      missingSubjects: recall.missing || [],
    };
  }

  /**
   * Prepare precision metric data
   * @param {object} precision - Precision metrics
   * @returns {object} Precision template data
   */
  #preparePrecisionData(precision) {
    return {
      precisionValue: ((precision.value || 0) * 100).toFixed(1),
      precisionThreshold: ((precision.threshold || 0) * 100).toFixed(0),
      precisionStatus: precision.passed ? "PASS" : "FAIL",
    };
  }

  /**
   * Prepare trace-specific template data
   * @param {object} base - Base template data
   * @param {EvaluationResult} result - Evaluation result
   * @returns {object} Trace template data
   */
  #prepareTraceData(base, result) {
    const details = result.details;
    return {
      ...base,
      traceCount: details.traceCount || 0,
      checks: (details.checks || []).map((check) => ({
        checkStatus: check.passed ? "✅" : "❌",
        command: check.command,
      })),
    };
  }
}
