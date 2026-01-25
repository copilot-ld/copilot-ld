import { memory } from "@copilot-ld/libtype";

/**
 * Recall-based evaluator for knowledge retrieval validation
 * Evaluates agent responses by checking if all expected subjects are retrieved
 *
 * Evaluates whether the agent retrieves all relevant context from the knowledge base
 * by examining which resource identifiers were stored in resource memory.
 * Includes sub-agent memory entries by discovering child conversation resources.
 */
export class RecallEvaluator {
  #agentConfig;
  #memoryClient;
  #storage;

  /**
   * Create a new RecallEvaluator instance
   * @param {import('@copilot-ld/libconfig').Config} agentConfig - Agent configuration with budget and allocation
   * @param {import('@copilot-ld/librpc').MemoryClient} memoryClient - Memory client for retrieving context
   * @param {import('@copilot-ld/libstorage').Storage} storage - Memory storage for discovering child resources
   */
  constructor(agentConfig, memoryClient, storage) {
    if (!agentConfig) throw new Error("agentConfig is required");
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!storage) throw new Error("storage is required");
    this.#agentConfig = agentConfig;
    this.#memoryClient = memoryClient;
    this.#storage = storage;
  }

  /**
   * Evaluate recall quality for agent response
   * @param {object} scenario - Scenario with evaluations array containing subject IRIs
   * @param {string} resourceId - Resource ID from agent response
   * @param {object} agentResponse - Agent response containing the assistant message
   * @param {string} model - Model name for memory window budget calculation
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(scenario, resourceId, agentResponse, model) {
    if (!scenario.evaluations || scenario.evaluations.length === 0) {
      throw new Error(`Scenario ${scenario.name} missing evaluations`);
    }
    if (!model) throw new Error("model is required");

    // Discover all memory files (parent + child sub-agent conversations)
    const resourceKeys = await this.#storage.findByPrefix(`${resourceId}`);
    const memoryFiles = resourceKeys.filter((k) => k.endsWith(".jsonl"));

    // Aggregate identifiers from all memory windows
    const retrievedSubjects = [];

    for (const key of memoryFiles) {
      const childResourceId = key.replace(".jsonl", "");

      const windowRequest = memory.WindowRequest.fromObject({
        resource_id: childResourceId,
        model,
        budget: this.#agentConfig.budget?.tokens,
        allocation: this.#agentConfig.budget?.allocation,
      });

      const memoryWindow = await this.#memoryClient.GetWindow(windowRequest);

      // Extract subjects from this window's message identifiers
      for (const message of memoryWindow.messages) {
        if (message.id && message.id.subjects) {
          retrievedSubjects.push(...message.id.subjects);
        }
      }
    }

    // Calculate recall
    const retrievedSet = new Set(retrievedSubjects);

    // Extract response text from agent response (last assistant message with content)
    const assistantMessages = (agentResponse?.messages || []).filter(
      (m) => m.role === "assistant" && m.content && m.content.trim().length > 0,
    );
    const responseText =
      assistantMessages.length > 0
        ? assistantMessages[assistantMessages.length - 1].content
        : null;

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
