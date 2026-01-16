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
   * Adds an evaluation result to the index
   * @param {object} result - Evaluation result object
   * @param {string} result.resourceId - Resource ID (conversation ID) as key
   * @param {string} result.scenario - Scenario ID
   * @param {boolean} result.passed - Whether evaluation passed
   * @param {string} result.type - Evaluation type (criteria/recall/trace)
   * @param {string} result.prompt - Evaluation prompt
   * @param {string} result.response - Agent response
   * @param {object} [result.metadata] - Optional metadata (complexity, rationale)
   * @param {Array} [result.evaluations] - Criteria evaluations array
   * @param {Array} [result.subjects] - Recall subjects array
   * @param {Array} [result.checks] - Trace checks array
   * @returns {Promise<void>}
   */
  async add(result) {
    if (!result.resource) throw new Error("resource is required");
    if (!result.scenario) throw new Error("scenario is required");

    const item = {
      id: result.resource,
      scenario: result.scenario,
      result: result,
    };

    await super.add(item);
  }

  /**
   * Gets all evaluation results for a specific scenario
   * @param {string} scenario - Scenario ID to filter by
   * @returns {Promise<object[]>} Array of evaluation results for this scenario
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

    // Return the result objects
    return items.map((item) => item.result);
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
