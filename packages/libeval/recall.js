/* eslint-env node */
import { MemoryIndex } from "@copilot-ld/libmemory/index/memory.js";

/**
 * Recall-based evaluator for knowledge retrieval validation
 * Evaluates agent responses by checking if all expected subjects are retrieved
 *
 * Evaluates whether the agent retrieves all relevant context from the knowledge base
 * by examining which resource identifiers were stored in resource memory.
 */
export class RecallEvaluator {
  #storage;

  /**
   * Create a new RecallEvaluator instance
   * @param {import('@copilot-ld/libstorage').StorageInterface} storage - Storage instance for memories
   */
  constructor(storage) {
    if (!storage) throw new Error("storage is required");
    this.#storage = storage;
  }

  /**
   * Evaluate recall quality for agent response
   * @param {object} scenario - Scenario with evaluations array containing subject IRIs
   * @param {string} resourceId - Resource ID from agent response
   * @returns {Promise<object>} Evaluation result with passed and evaluations
   */
  async evaluate(scenario, resourceId) {
    if (!scenario.evaluations || scenario.evaluations.length === 0) {
      throw new Error(`Scenario ${scenario.name} missing evaluations`);
    }

    // Create a MemoryIndex for this resourceId and fetch all items
    const indexKey = `${resourceId}.jsonl`;
    const memoryIndex = new MemoryIndex(this.#storage, indexKey);
    const allItems = await memoryIndex.queryItems();

    // Extract retrieved subjects from identifiers
    const retrievedSubjects = allItems
      .filter((identifier) => identifier.subjects?.length > 0)
      .flatMap((identifier) => identifier.subjects);

    // Calculate recall
    const retrievedSet = new Set(retrievedSubjects);

    // Build one evaluation per subject IRI in evaluations array
    const evaluationResults = scenario.evaluations.map((evaluation) => {
      const subject = evaluation.data;
      const passed = retrievedSet.has(subject);
      return {
        label: evaluation.label,
        data: subject,
        passed,
      };
    });

    // Pass if all subjects are found
    const passed = evaluationResults.every((e) => e.passed);

    return {
      passed,
      evaluations: evaluationResults,
    };
  }
}
