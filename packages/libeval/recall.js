/* eslint-env node */
import { memory } from "@copilot-ld/libtype";

/**
 * Recall-based evaluator for knowledge retrieval validation
 * Evaluates agent responses by checking if all expected subjects are retrieved
 *
 * Evaluates whether the agent retrieves all relevant context from the knowledge base
 * by examining which resource identifiers were stored in resource memory.
 */
export class RecallEvaluator {
  #agentConfig;
  #memoryClient;

  /**
   * Create a new RecallEvaluator instance
   * @param {import('@copilot-ld/libconfig').Config} agentConfig - Agent configuration with budget and allocation
   * @param {import('@copilot-ld/librpc').MemoryClient} memoryClient - Memory client for retrieving context
   */
  constructor(agentConfig, memoryClient) {
    if (!agentConfig) throw new Error("agentConfig is required");
    if (!memoryClient) throw new Error("memoryClient is required");
    this.#agentConfig = agentConfig;
    this.#memoryClient = memoryClient;
  }

  /**
   * Evaluate recall quality for agent response
   * @param {object} scenario - Scenario with evaluations array containing subject IRIs
   * @param {string} resourceId - Resource ID from agent response
   * @param {object} agentResponse - Agent response containing the assistant message
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(scenario, resourceId, agentResponse) {
    if (!scenario.evaluations || scenario.evaluations.length === 0) {
      throw new Error(`Scenario ${scenario.name} missing evaluations`);
    }

    // Get memory window with all resource context
    const windowRequest = memory.WindowRequest.fromObject({
      resource_id: resourceId,
      budget: this.#agentConfig.budget?.tokens,
      allocation: this.#agentConfig.budget?.allocation,
    });
    const memoryWindow = await this.#memoryClient.GetWindow(windowRequest);

    // Extract retrieved subjects from context identifiers
    const retrievedSubjects = memoryWindow.context
      .map((identifier) => identifier.subject)
      .filter((subject) => subject); // Remove empty subjects

    // Calculate recall
    const retrievedSet = new Set(retrievedSubjects);

    // Extract response text from agent response
    const responseText = agentResponse?.choices?.[0]?.message?.content;

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
      scenario: scenario.name,
      type: "recall",
      passed,
      prompt: scenario.prompt,
      response: responseText,
      evaluations: evaluationResults,
    };
  }
}
