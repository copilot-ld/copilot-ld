import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import mustache from "mustache";
import { memory } from "@copilot-ld/libtype";

/**
 * EvaluationReporter generates summary and per-scenario reports from evaluation index
 * Uses mustache templates to generate markdown reports
 */
export class EvaluationReporter {
  #agentConfig;
  #evaluationIndex;
  #traceVisualizer;
  #memoryClient;
  #summaryTemplate;
  #scenarioTemplate;
  #configStorage;

  /**
   * Create a new EvaluationReporter instance
   * @param {import("@copilot-ld/libconfig").Config} agentConfig - Agent configuration with budget and allocation
   * @param {import("./index/evaluation.js").EvaluationIndex} evaluationIndex - Evaluation index with results
   * @param {import("@copilot-ld/libtelemetry/visualizer.js").TraceVisualizer} traceVisualizer - Trace visualizer for generating trace diagrams
   * @param {import("../../generated/services/memory/client.js").MemoryClient} memoryClient - Memory client for fetching memory windows
   * @param {import("@copilot-ld/libstorage").Storage} configStorage - Storage for configuration data
   */
  constructor(
    agentConfig,
    evaluationIndex,
    traceVisualizer,
    memoryClient,
    configStorage,
  ) {
    if (!agentConfig) throw new Error("agentConfig is required");
    if (!evaluationIndex) throw new Error("evaluationIndex is required");
    if (!traceVisualizer) throw new Error("traceVisualizer is required");
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!configStorage) throw new Error("configStorage is required");

    this.#agentConfig = agentConfig;
    this.#evaluationIndex = evaluationIndex;
    this.#traceVisualizer = traceVisualizer;
    this.#memoryClient = memoryClient;
    this.#configStorage = configStorage;

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
    const formatted = text.replace(/\n/g, " ").replace(/\s+/g, " ");
    return inlineCode ? `\`\` ${formatted} \`\`` : formatted;
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
   * Fetch all agent profiles from config storage
   * @returns {Promise<Array<{name: string, filename: string, content: string, description: string, tools: string}>>} Array of agent profiles
   */
  async #fetchAgentProfiles() {
    const allKeys = await this.#configStorage.list();
    const agentKeys = allKeys.filter(
      (key) =>
        key.startsWith("agents/") &&
        key.endsWith(".agent.md") &&
        !key.includes("eval_judge"),
    );

    const profiles = await Promise.all(
      agentKeys.map(async (key) => {
        const content = await this.#configStorage.get(key);
        if (!content || typeof content !== "string") return null;
        const name = key.replace("agents/", "").replace(".agent.md", "");
        const filename = `${name}.agent.md`;
        const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
        const description =
          fm.match(/^description:\s*(.+)$/m)?.[1]?.trim() || "";
        const toolsMatch = fm.match(/^tools:\n((?:\s+-\s+.+\n?)+)/m);
        const tools = toolsMatch
          ? toolsMatch[1]
              .split("\n")
              .map((l) => l.replace(/^\s*-\s*/, "").trim())
              .filter(Boolean)
              .join(", ")
          : "";
        return { name, filename, content, description, tools };
      }),
    );

    return profiles.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Fetch and format memory window for a resource
   * @param {string} resource_id - Resource ID to fetch memory for
   * @param {string} model - Model name for memory window budget calculation
   * @returns {Promise<Array<{subject: string, resource: string, score: number|null}>>} Formatted memory data
   */
  async #fetchMemoryWindow(resource_id, model) {
    const request = memory.WindowRequest.fromObject({
      resource_id,
      model,
      budget: this.#agentConfig.budget?.tokens,
      allocation: this.#agentConfig.budget?.allocation || {
        tools: 0.01,
        context: 0.98,
        conversation: 0.01,
      },
    });

    const response = await this.#memoryClient.GetWindow(request);

    // Format message identifiers for the template
    return (response.messages || [])
      .filter((m) => m.id?.subjects?.length > 0)
      .flatMap((m) =>
        m.id.subjects.map((subject) => ({
          subject: subject || "unknown",
          resource: `${m.id.type}.${m.id.name}`,
          score: m.id.score || null,
        })),
      );
  }

  /**
   * Generate summary report for all scenarios
   * @returns {Promise<string>} Markdown formatted summary report
   */
  async generateSummary() {
    const scenarios = await this.#evaluationIndex.getAllScenarios();

    // Get all unique models
    const allResults = [];
    for (const scenario of scenarios) {
      const results = await this.#evaluationIndex.getByScenario(scenario);
      allResults.push(...results);
    }
    const models = [
      ...new Set(allResults.map((r) => r.model || "default")),
    ].sort();

    const scenarioStats = [];
    let totalRuns = 0;
    let totalPassed = 0;

    for (const scenario of scenarios) {
      const results = await this.#evaluationIndex.getByScenario(scenario);
      const scenarioRuns = results.length;
      const scenarioPassed = results.filter((r) => r.passed).length;
      const scenarioRate =
        scenarioRuns > 0
          ? ((scenarioPassed / scenarioRuns) * 100).toFixed(1)
          : "0.0";

      totalRuns += scenarioRuns;
      totalPassed += scenarioPassed;

      // Get scenario-level data from first result
      const firstResult = results[0];

      // Generate model-specific statistics
      const modelStats = models.map((model) => {
        const modelResults = results.filter(
          (r) => (r.model || "default") === model,
        );
        const modelPassed = modelResults.filter((r) => r.passed).length;
        const modelTotal = modelResults.length;
        const modelRate =
          modelTotal > 0
            ? ((modelPassed / modelTotal) * 100).toFixed(1)
            : "0.0";

        // Generate visual indicators for this model's results
        const indicators = this.#generateIndicators(modelResults);

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
        type: firstResult?.type || "unknown",
        complexity: firstResult?.metadata?.complexity || "unknown",
        rationale: (firstResult?.metadata?.rationale || "").replace(/\n+$/, ""),
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
      const modelResults = allResults.filter(
        (r) => (r.model || "default") === model,
      );
      const modelPassed = modelResults.filter((r) => r.passed).length;
      const modelTotal = modelResults.length;
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
    const results = await this.#evaluationIndex.getByScenario(scenario);

    if (results.length === 0) {
      throw new Error(`No results found for scenario: ${scenario}`);
    }

    // Get scenario details from first result
    const firstResult = results[0];

    // Calculate statistics
    const totalRuns = results.length;
    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = totalRuns - totalPassed;
    const totalRate =
      totalRuns > 0 ? ((totalPassed / totalRuns) * 100).toFixed(1) : "0.0";

    // Generate visual pass/fail indicators
    const indicators = this.#generateIndicators(results);

    // Determine if evaluations should be wrapped in code blocks (only for trace type)
    const inlineCode = firstResult.type === "trace";

    // Prepare results with run numbers and formatted data
    const formattedResults = await Promise.all(
      results.map(async (result, r) => {
        // Generate trace visualization for this result's resource
        let trace = "";
        if (result.resource) {
          trace = await this.#traceVisualizer.visualize(null, {
            resource_id: result.resource,
          });
        }

        // Fetch memory window for this result's resource
        const memories = result.resource
          ? await this.#fetchMemoryWindow(result.resource, result.model)
          : [];

        const evaluations = result.evaluations
          ? result.evaluations.map((item, e) => ({
              index: e + 1,
              passed: item.passed,
              label: item.label,
              data: this.#formatEvaluation(item.data, inlineCode),
              detail: item.detail,
            }))
          : null;

        return {
          index: r + 1,
          resource: result.resource,
          model: result.model || "default",
          passed: result.passed,
          response: result.response,
          trace,
          evaluations,
          memories,
        };
      }),
    );

    // Prepare evaluations list for Method section (without pass/fail status)
    const evaluationsList = firstResult.evaluations
      ? firstResult.evaluations.map((item, e) => ({
          index: e + 1,
          label: item.label,
        }))
      : [];

    // Fetch agent profiles for appendix
    const agents = await this.#fetchAgentProfiles();

    const templateData = {
      scenario,
      type: firstResult.type,
      complexity: firstResult.metadata?.complexity || "unknown",
      rationale: (firstResult.metadata?.rationale || "").replace(/\n+$/, ""),
      prompt: (firstResult.prompt || "").replace(/\n+$/, ""),
      indicators,
      evaluations: evaluationsList,
      total: {
        runs: totalRuns,
        passed: totalPassed,
        failed: totalFailed,
        rate: totalRate,
        evaluations: firstResult.evaluations.length,
      },
      results: formattedResults,
      agents,
    };

    return mustache.render(this.#scenarioTemplate, templateData);
  }

  /**
   * Generate all reports (summary + individual scenario reports)
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage for writing reports
   * @returns {Promise<void>}
   */
  async generateAll(storage) {
    // Write agent profile files
    const agents = await this.#fetchAgentProfiles();
    for (const agent of agents) {
      await storage.put(`agents/${agent.filename}`, agent.content);
    }

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
