import { common, agent, feedback } from "@copilot-ld/libtype";

/**
 * @typedef {object} ReporterInterface
 * @property {function(object[]): Promise<string>} generate - Generate report from evaluation results array
 */

/**
 * Main evaluator orchestrates the evaluation workflow
 * Dispatches to appropriate evaluator based on scenario configuration
 */
export class Evaluator {
  #agentClient;
  #feedbackClient;
  #llmToken;
  #model;
  #judgeEvaluator;
  #recallEvaluator;
  #traceEvaluator;
  #evaluationIndex;

  /**
   * Create a new Evaluator instance
   * @param {import('@copilot-ld/librpc').AgentClient} agentClient - Agent client for evaluation
   * @param {import('@copilot-ld/librpc').MemoryClient} memoryClient - Memory client for recall evaluation
   * @param {import('@copilot-ld/librpc').TraceClient} traceClient - Trace client for trace evaluation
   * @param {import('@copilot-ld/librpc').FeedbackClient} feedbackClient - Feedback client for feedback submission
   * @param {string} llmToken - GitHub token for API access
   * @param {string} [model] - Optional model override for LLM service
   * @param {import('./index/evaluation.js').EvaluationIndex} evaluationIndex - Evaluation index for storing results
   * @param {import('./criteria.js').JudgeEvaluator} judgeEvaluator - Judge evaluator instance
   * @param {import('./recall.js').RecallEvaluator} recallEvaluator - Recall evaluator instance
   * @param {import('./trace.js').TraceEvaluator} traceEvaluator - Trace evaluator instance
   */
  constructor(
    agentClient,
    memoryClient,
    traceClient,
    feedbackClient,
    llmToken,
    model,
    evaluationIndex,
    judgeEvaluator,
    recallEvaluator,
    traceEvaluator,
  ) {
    if (!agentClient) throw new Error("agentClient is required");
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!traceClient) throw new Error("traceClient is required");
    if (!feedbackClient) throw new Error("feedbackClient is required");
    if (!llmToken) throw new Error("llmToken is required");
    if (!evaluationIndex) throw new Error("evaluationIndex is required");
    if (!judgeEvaluator) throw new Error("judgeEvaluator is required");
    if (!recallEvaluator) throw new Error("recallEvaluator is required");
    if (!traceEvaluator) throw new Error("traceEvaluator is required");

    this.#agentClient = agentClient;
    this.#feedbackClient = feedbackClient;
    this.#llmToken = llmToken;
    this.#model = model;
    this.#evaluationIndex = evaluationIndex;
    this.#judgeEvaluator = judgeEvaluator;
    this.#recallEvaluator = recallEvaluator;
    this.#traceEvaluator = traceEvaluator;
  }

  /**
   * Evaluate a single scenario
   * @param {object} scenario - Scenario to evaluate
   * @returns {Promise<object>} Evaluation result for this scenario
   */
  async evaluate(scenario) {
    // Execute prompt against agent
    const request = agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({ role: "user", content: scenario.prompt }),
      ],
      llm_token: this.#llmToken,
      model: this.#model,
    });

    const response = await this.#agentClient.ProcessUnary(request);
    const resource = response.resource_id;

    // Determine evaluation type and dispatch based on scenario.type
    let result;
    if (scenario.type === "criteria" || scenario.type === "judge") {
      result = await this.#judgeEvaluator.evaluate(scenario, response);
    } else if (scenario.type === "recall") {
      result = await this.#recallEvaluator.evaluate(
        scenario,
        resource,
        response,
        this.#model,
      );
    } else if (scenario.type === "trace") {
      result = await this.#traceEvaluator.evaluate(
        scenario,
        resource,
        response,
      );
    } else {
      throw new Error(
        `Invalid scenario: ${scenario.name} - unknown type: ${scenario.type}`,
      );
    }

    // Add resource ID to result for debugging
    result.resource = resource;

    // Add model to result
    result.model = this.#model || "default";

    // Add metadata to result (if present in scenario)
    if (scenario.complexity || scenario.rationale) {
      result.metadata = {
        complexity: scenario.complexity || null,
        rationale: scenario.rationale || null,
      };
    }

    // Store result in evaluation index
    await this.#evaluationIndex.add(result);

    // Submit feedback to feedback service
    await this.#submitFeedback(resource, result.passed);

    return result;
  }

  /**
   * Submit feedback to the feedback service
   * @param {string} resourceId - Resource ID from agent response
   * @param {boolean} passed - Whether the evaluation passed
   * @returns {Promise<void>}
   */
  async #submitFeedback(resourceId, passed) {
    const record = feedback.FeedbackRecord.fromObject({
      conversation_id: resourceId,
      trace_id: resourceId,
      signal: passed ? feedback.Signal.POSITIVE : feedback.Signal.NEGATIVE,
      timestamp: Date.now(),
    });

    await this.#feedbackClient.RecordFeedback(record);
  }
}

export { EvaluationIndex } from "./index/evaluation.js";
export { EvaluationReporter } from "./reporter.js";
export { JudgeEvaluator } from "./judge.js";
export { RecallEvaluator } from "./recall.js";
export { TraceEvaluator } from "./trace.js";
