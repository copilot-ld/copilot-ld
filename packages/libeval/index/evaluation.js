/* eslint-env node */
import { BufferedIndex } from "@copilot-ld/libindex";

/**
 * EvaluationIndex stores evaluation results for analysis
 * Each item represents a single evaluation run indexed by resource_id
 * Uses BufferedIndex for efficient parallel writes during evaluation runs
 */
export class EvaluationIndex extends BufferedIndex {
  /**
   * Creates a new EvaluationIndex instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage interface for eval data
   * @param {object} [config] - Buffer configuration
   * @param {number} [config.flush_interval] - Flush interval in milliseconds (default: 5000)
   * @param {number} [config.max_buffer_size] - Max items before forced flush (default: 1000)
   */
  constructor(storage, config = {}) {
    super(storage, "index.jsonl", config);
  }

  /**
   * Adds an evaluation run to the index
   * @param {object} run - Evaluation run object
   * @param {string} run.resource - Resource ID (conversation ID) as key
   * @param {string} run.scenario - Scenario ID
   * @param {boolean} run.passed - Whether evaluation passed
   * @param {string} run.type - Evaluation type (criteria/recall/trace)
   * @param {string} run.prompt - Evaluation prompt
   * @param {string[]} run.responses - Agent responses
   * @param {string} run.complexity - Scenario complexity
   * @param {string} run.rationale - Scenario rationale
   * @param {Array} [run.evaluations] - Evaluation results array
   * @returns {Promise<void>}
   */
  async add(run) {
    if (!run.resource) throw new Error("resource is required");
    if (!run.scenario) throw new Error("scenario is required");

    const item = {
      id: run.resource,
      scenario: run.scenario,
      run: run,
    };

    await super.add(item);
  }

  /**
   * Gets all evaluation runs for a specific scenario
   * @param {string} scenario - Scenario ID to filter by
   * @returns {Promise<object[]>} Array of evaluation runs for this scenario
   */
  async getByScenario(scenario) {
    if (!this.loaded) await this.loadData();

    const items = [];
    for (const item of this.index.values()) {
      if (item.scenario === scenario) {
        items.push(item);
      }
    }

    // Sort by timestamp descending (newest first)
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return the run objects
    return items.map((item) => item.run);
  }

  /**
   * Gets all unique scenarios in the index
   * @returns {Promise<string[]>} Array of unique scenario IDs
   */
  async getAllScenarios() {
    if (!this.loaded) await this.loadData();

    const scenarios = new Set();
    for (const item of this.index.values()) {
      if (item.scenario) {
        scenarios.add(item.scenario);
      }
    }

    return Array.from(scenarios).sort();
  }
}
