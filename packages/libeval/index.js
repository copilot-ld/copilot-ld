/* eslint-env node */
import { common, agent } from "@copilot-ld/libtype";

import { ParseError } from "./error.js";

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
  #githubToken;
  #model;
  #judgeEvaluator;
  #recallEvaluator;
  #traceEvaluator;
  #evaluationIndex;

  /**
   * Create a new Evaluator instance
   * @param {import('@copilot-ld/librpc').AgentClient} agentClient - Agent client for evaluation
   * @param {import('@copilot-ld/librpc').TraceClient} traceClient - Trace client for trace evaluation
   * @param {string} githubToken - GitHub token for API access
   * @param {string} [model] - Optional model override for LLM service
   * @param {import('./index/evaluation.js').EvaluationIndex} evaluationIndex - Evaluation index for storing results
   * @param {import('./judge.js').JudgeEvaluator} judgeEvaluator - Judge evaluator instance
   * @param {import('./recall.js').RecallEvaluator} recallEvaluator - Recall evaluator instance
   * @param {import('./trace.js').TraceEvaluator} traceEvaluator - Trace evaluator instance
   */
  constructor(
    agentClient,
    traceClient,
    githubToken,
    model,
    evaluationIndex,
    judgeEvaluator,
    recallEvaluator,
    traceEvaluator,
  ) {
    if (!agentClient) throw new Error("agentClient is required");
    if (!traceClient) throw new Error("traceClient is required");
    if (!githubToken) throw new Error("githubToken is required");
    if (!evaluationIndex) throw new Error("evaluationIndex is required");
    if (!judgeEvaluator) throw new Error("judgeEvaluator is required");
    if (!recallEvaluator) throw new Error("recallEvaluator is required");
    if (!traceEvaluator) throw new Error("traceEvaluator is required");

    this.#agentClient = agentClient;
    this.#githubToken = githubToken;
    this.#model = model;
    this.#evaluationIndex = evaluationIndex;
    this.#judgeEvaluator = judgeEvaluator;
    this.#recallEvaluator = recallEvaluator;
    this.#traceEvaluator = traceEvaluator;
  }

  /**
   * Process the stream of responses from the agent
   * Collects all responses without merging them
   * @param {object} stream - The stream of agent responses
   * @returns {Promise<object>} The response object with responses array
   */
  async #processStream(stream) {
    const response = {
      responses: [],
      resource_id: null,
      usage: null,
      model: null,
      created: null,
      object: null,
    };

    for await (const chunk of stream) {
      this.#updateResponseMetadata(response, chunk);
      this.#collectResponses(response, chunk);
    }
    return response;
  }

  /**
   * Update response metadata from chunk
   * @param {object} response - The response object
   * @param {object} chunk - The current chunk
   */
  #updateResponseMetadata(response, chunk) {
    if (chunk.resource_id) response.resource_id = chunk.resource_id;
    if (chunk.usage) response.usage = chunk.usage;
    if (chunk.model) response.model = chunk.model;
    if (chunk.created) response.created = chunk.created;
    if (chunk.object) response.object = chunk.object;
  }

  /**
   * Collect responses from chunk into responses array
   * @param {object} response - The response object
   * @param {object} chunk - The current chunk
   */
  #collectResponses(response, chunk) {
    if (chunk.messages && chunk.messages.length > 0) {
      for (const msg of chunk.messages) {
        if (msg.role === "assistant" && msg.content) {
          response.responses.push(msg.content);
        }
      }
    }
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
      github_token: this.#githubToken,
      model: this.#model,
    });

    const stream = this.#agentClient.ProcessStream(request);
    const response = await this.#processStream(stream);

    const resource = response.resource_id;
    const responses = response.responses;

    // Build run with all scenario metadata
    const run = {
      scenario: scenario.name,
      type: scenario.type,
      complexity: scenario.complexity,
      rationale: scenario.rationale,
      prompt: scenario.prompt,
      resource,
      responses,
      model: this.#model || "default",
    };

    // Determine evaluation type and dispatch based on scenario.type
    // Evaluators return only their specific properties (passed, evaluations)
    // Retry up to 2 times on ParseError
    const maxRetries = 2;
    let result;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (scenario.type === "judge") {
          result = await this.#judgeEvaluator.evaluate(scenario, responses);
        } else if (scenario.type === "recall") {
          result = await this.#recallEvaluator.evaluate(scenario, resource);
        } else if (scenario.type === "trace") {
          result = await this.#traceEvaluator.evaluate(scenario, resource);
        } else {
          throw new Error(
            `Invalid scenario: ${scenario.name} - unknown type: ${scenario.type}`,
          );
        }
        break;
      } catch (error) {
        lastError = error;
        if (error instanceof ParseError && attempt < maxRetries) {
          continue;
        }
        throw error;
      }
    }

    if (!result) {
      throw lastError || new Error("Evaluation failed without result");
    }

    // Merge evaluator-specific properties onto run
    Object.assign(run, result);

    // Store run in evaluation index
    await this.#evaluationIndex.add(run);

    return run;
  }
}

export { EvaluationIndex } from "./index/evaluation.js";
export { EvaluationReporter } from "./reporter.js";
export { JudgeEvaluator } from "./judge.js";
export { ParseError } from "./error.js";
export { RecallEvaluator } from "./recall.js";
export { TraceEvaluator } from "./trace.js";
