/* eslint-env node */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import mustache from "mustache";
import { MemoryIndex } from "@copilot-ld/libmemory/index/memory.js";

/**
 * EvaluationReporter generates summary and per-scenario reports from evaluation index
 * Uses mustache templates to generate markdown reports
 */
export class EvaluationReporter {
  #evaluationIndex;
  #traceVisualizer;
  #memoryStorage;
  #summaryTemplate;
  #scenarioTemplate;

  /**
   * Create a new EvaluationReporter instance
   * @param {import("@copilot-ld/libconfig").Config} agentConfig - Agent configuration with budget and allocation
   * @param {import("./index/evaluation.js").EvaluationIndex} evaluationIndex - Evaluation index with results
   * @param {import("@copilot-ld/libtelemetry/visualizer.js").TraceVisualizer} traceVisualizer - Trace visualizer for generating trace diagrams
   * @param {import("@copilot-ld/libstorage").StorageInterface} memoryStorage - Storage instance for memories
   */
  constructor(agentConfig, evaluationIndex, traceVisualizer, memoryStorage) {
    if (!agentConfig) throw new Error("agentConfig is required");
    if (!evaluationIndex) throw new Error("evaluationIndex is required");
    if (!traceVisualizer) throw new Error("traceVisualizer is required");
    if (!memoryStorage) throw new Error("memoryStorage is required");

    this.#evaluationIndex = evaluationIndex;
    this.#traceVisualizer = traceVisualizer;
    this.#memoryStorage = memoryStorage;

    const __dirname = dirname(fileURLToPath(import.meta.url));
    this.#summaryTemplate = readFileSync(
      join(__dirname, "./templates/summary.md.mustache"),
      "utf8",
    );
    this.#scenarioTemplate = readFileSync(
      join(__dirname, "./templates/scenario.md.mustache"),
      "utf8",
    );
  }

  /**
   * Format evaluation results for consistent display.
   * @param {string} text - Text to format
   * @param {boolean} inlineCode - Whether to wrap in inline code block
   * @returns {string} Formatted text
   */
  #formatEvaluation(text, inlineCode = false) {
    let formatted = text.replace(/\n/g, " ").replace(/\s+/g, " ");

    if (inlineCode) {
      formatted = `\`\` ${formatted} \`\``;
    }

    return formatted;
  }

  /**
   * Generate visual pass/fail indicators from results
   * @param {Array<{passed: boolean}>} results - Array of evaluation results
   * @returns {string} Space-separated string of check/cross marks
   */
  #generateIndicators(results) {
    return results.map((r) => (r.passed ? "✅" : "❌")).join(" ");
  }

  /**
   * Fetch and format memory items for a resource
   * @param {string} resource_id - Resource ID to fetch memory for
   * @returns {Promise<Array<{subject: string, resource: string, score: number|null}>>} Formatted memory data
   */
  async #fetchMemoryItems(resource_id) {
    // Create a MemoryIndex for this resourceId and fetch all items
    const indexKey = `${resource_id}.jsonl`;
    const memoryIndex = new MemoryIndex(this.#memoryStorage, indexKey);
    const allItems = await memoryIndex.queryItems();

    // Format identifiers for the template, flattening subjects
    const memories = [];

    for (const identifier of allItems) {
      const subjects = identifier.subjects || [];
      // Build full resource path: parent/type.name
      const resource = identifier.parent
        ? `${identifier.parent}/${identifier.type}.${identifier.name}`
        : `${identifier.type}.${identifier.name}`;
      const score = identifier.score || null;

      // Create one entry per subject for the template
      for (const subject of subjects) {
        memories.push({ subject, resource, score });
      }
    }

    return memories;
  }

  /**
   * Generate summary report for all scenarios
   * @returns {Promise<string>} Markdown formatted summary report
   */
  async generateSummary() {
    const scenarios = await this.#evaluationIndex.getAllScenarios();

    // Get all unique models
    const allRuns = [];
    for (const scenario of scenarios) {
      const runs = await this.#evaluationIndex.getByScenario(scenario);
      allRuns.push(...runs);
    }
    const models = [
      ...new Set(allRuns.map((r) => r.model || "default")),
    ].sort();

    const scenarioStats = [];
    let totalRuns = 0;
    let totalPassed = 0;

    for (const scenario of scenarios) {
      const runs = await this.#evaluationIndex.getByScenario(scenario);
      const scenarioRuns = runs.length;
      const scenarioPassed = runs.filter((r) => r.passed).length;
      const scenarioRate =
        scenarioRuns > 0
          ? ((scenarioPassed / scenarioRuns) * 100).toFixed(1)
          : "0.0";

      totalRuns += scenarioRuns;
      totalPassed += scenarioPassed;

      // Get scenario-level data from first run
      const firstRun = runs[0];

      // Generate model-specific statistics
      const modelStats = models.map((model) => {
        const modelRuns = runs.filter((r) => (r.model || "default") === model);
        const modelPassed = modelRuns.filter((r) => r.passed).length;
        const modelTotal = modelRuns.length;
        const modelRate =
          modelTotal > 0
            ? ((modelPassed / modelTotal) * 100).toFixed(1)
            : "0.0";

        // Generate visual indicators for this model's runs
        const indicators = this.#generateIndicators(modelRuns);

        return {
          model,
          passed: modelPassed,
          total: modelTotal,
          rate: modelRate,
          indicators,
        };
      });

      scenarioStats.push({
        scenario: scenario,
        type: firstRun?.type || "unknown",
        complexity: firstRun?.complexity || "unknown",
        rationale: (firstRun?.rationale || "").replace(/\n+$/, ""),
        total: {
          runs: scenarioRuns,
          passed: scenarioPassed,
          rate: scenarioRate,
        },
        models: modelStats,
      });
    }

    const totalRate =
      totalRuns > 0 ? ((totalPassed / totalRuns) * 100).toFixed(1) : "0.0";

    // Calculate per-model overall pass rates
    const modelRates = models.map((model) => {
      const modelRuns = allRuns.filter((r) => (r.model || "default") === model);
      const modelPassed = modelRuns.filter((r) => r.passed).length;
      const modelTotal = modelRuns.length;
      const modelRate =
        modelTotal > 0 ? ((modelPassed / modelTotal) * 100).toFixed(1) : "0.0";

      return {
        model,
        rate: modelRate,
        passed: modelPassed,
        total: modelTotal,
      };
    });

    const templateData = {
      total: {
        scenarios: scenarios.length,
        runs: totalRuns,
        rate: totalRate,
      },
      models,
      modelRates,
      scenarios: scenarioStats,
    };

    return mustache.render(this.#summaryTemplate, templateData);
  }

  /**
   * Generate detailed report for a specific scenario
   * @param {string} scenario - Scenario ID to generate report for
   * @returns {Promise<string>} Markdown formatted scenario report
   */
  async generateScenarioReport(scenario) {
    const runs = await this.#evaluationIndex.getByScenario(scenario);

    if (runs.length === 0) {
      throw new Error(`No runs found for scenario: ${scenario}`);
    }

    // Get scenario details from first run
    const firstRun = runs[0];

    // Calculate statistics
    const totalRuns = runs.length;
    const totalPassed = runs.filter((r) => r.passed).length;
    const totalFailed = totalRuns - totalPassed;
    const totalRate =
      totalRuns > 0 ? ((totalPassed / totalRuns) * 100).toFixed(1) : "0.0";

    // Generate visual pass/fail indicators
    const indicators = this.#generateIndicators(runs);

    // Determine if evaluations should be wrapped in code blocks (only for trace type)
    const inlineCode = firstRun.type === "trace";

    // Prepare runs with run numbers and formatted data
    const formattedRuns = await Promise.all(
      runs.map(async (run, r) => {
        // Generate trace visualization for this run's resource
        let trace = "";
        if (run.resource) {
          trace = await this.#traceVisualizer.visualize(null, {
            resource_id: run.resource,
          });
        }

        // Fetch memory items for this run's resource
        const memories = run.resource
          ? await this.#fetchMemoryItems(run.resource)
          : [];

        const evaluations = run.evaluations
          ? run.evaluations.map((item, e) => ({
              index: e + 1,
              passed: item.passed,
              label: item.label,
              data: this.#formatEvaluation(item.data, inlineCode),
              detail: item.detail,
            }))
          : null;

        return {
          index: r + 1,
          resource: run.resource,
          model: run.model || "default",
          passed: run.passed,
          responses: run.responses || [],
          trace,
          evaluations,
          memories,
        };
      }),
    );

    // Prepare evaluations list for Method section (without pass/fail status)
    const evaluationsList = firstRun.evaluations
      ? firstRun.evaluations.map((item, e) => ({
          index: e + 1,
          label: item.label,
        }))
      : [];

    const templateData = {
      scenario,
      type: firstRun.type,
      complexity: firstRun.complexity || "unknown",
      rationale: (firstRun.rationale || "").replace(/\n+$/, ""),
      prompt: (firstRun.prompt || "").replace(/\n+$/, ""),
      indicators,
      evaluations: evaluationsList,
      total: {
        runs: totalRuns,
        passed: totalPassed,
        failed: totalFailed,
        rate: totalRate,
        evaluations: firstRun.evaluations.length,
      },
      runs: formattedRuns,
    };

    return mustache.render(this.#scenarioTemplate, templateData);
  }

  /**
   * Generate all reports (summary + individual scenario reports)
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage for writing reports
   * @returns {Promise<void>}
   */
  async generateAll(storage) {
    // Generate and write summary report
    const summary = await this.generateSummary();
    await storage.put("SUMMARY.md", summary);

    // Generate and write individual scenario reports
    const scenarios = await this.#evaluationIndex.getAllScenarios();
    for (const scenario of scenarios) {
      const scenarioReport = await this.generateScenarioReport(scenario);
      await storage.put(`${scenario}.md`, scenarioReport);
    }
  }
}
