/* eslint-env node */
import { memory } from "@copilot-ld/libtype";

/**
 * Retrieval-based evaluator using metrics calculation
 * Evaluates agent responses based on retrieval quality metrics
 * 
 * Tests whether the agent retrieves relevant context from the knowledge base
 * by examining which resource identifiers were stored in conversation memory.
 */
export class RetrievalEvaluator {
  #memoryClient;

  /**
   * Create a new RetrievalEvaluator instance
   * @param {import('@copilot-ld/librpc').MemoryClient} memoryClient - Memory client for retrieving context
   */
  constructor(memoryClient) {
    if (!memoryClient) throw new Error("memoryClient is required");
    this.#memoryClient = memoryClient;
  }

  /**
   * Evaluate retrieval quality for agent response
   * @param {object} testCase - Test case with true_subjects and retrieval thresholds
   * @param {string} resourceId - Resource ID from agent response
   * @param {object} agentResponse - Agent response containing the assistant message
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(testCase, resourceId, agentResponse) {
    if (!testCase.true_subjects) {
      throw new Error(`Test case ${testCase.id} missing true_subjects`);
    }

    // Get memory window with all conversation context
    const windowRequest = memory.WindowRequest.fromObject({
      resource_id: resourceId,
      budget: 1000000, // Get everything
      allocation: { tools: 0.01, context: 0.98, conversation: 0.01 },
    });
    const memoryWindow = await this.#memoryClient.GetWindow(windowRequest);

    // Extract retrieved subjects from context identifiers
    const retrievedSubjects = memoryWindow.context
      .map((identifier) => identifier.subject)
      .filter((subject) => subject); // Remove empty subjects

    // Calculate metrics
    const trueSubjectsSet = new Set(testCase.true_subjects);
    const retrievedSet = new Set(retrievedSubjects);

    // Calculate recall: What fraction of true subjects were retrieved?
    const foundSubjects = testCase.true_subjects.filter((s) => retrievedSet.has(s));
    const recall = testCase.true_subjects.length > 0 
      ? foundSubjects.length / testCase.true_subjects.length 
      : 0;

    // Calculate precision: What fraction of retrieved subjects are relevant?
    const uniqueRetrieved = [...retrievedSet];
    const relevantCount = uniqueRetrieved.filter((s) => trueSubjectsSet.has(s)).length;
    const precision = uniqueRetrieved.length > 0 
      ? relevantCount / uniqueRetrieved.length 
      : 0;

    // Apply thresholds (default: require all subjects, ignore precision)
    const minRecall = testCase.min_recall !== undefined ? testCase.min_recall : 1.0;
    const minPrecision = testCase.min_precision !== undefined ? testCase.min_precision : 0.0;

    const recallPassed = recall >= minRecall;
    const precisionPassed = precision >= minPrecision;
    const passed = recallPassed && precisionPassed;

    // Extract response text from agent response
    const responseText = agentResponse?.choices?.[0]?.message?.content?.text || "";

    return {
      caseId: testCase.id,
      type: "retrieval",
      passed,
      metrics: {
        recall: {
          value: recall,
          threshold: minRecall,
          passed: recallPassed,
          found: foundSubjects,
          missing: testCase.true_subjects.filter((s) => !retrievedSet.has(s)),
        },
        precision: {
          value: precision,
          threshold: minPrecision,
          passed: precisionPassed,
        },
      },
      query: testCase.query,
      retrievedCount: retrievedSubjects.length,
      uniqueCount: uniqueRetrieved.length,
      response: responseText,
    };
  }
}
