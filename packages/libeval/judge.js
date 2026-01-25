import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import mustache from "mustache";
import { common, agent } from "@copilot-ld/libtype";

/**
 * Judge-based evaluator using agent service
 * Evaluates agent responses against natural language criteria
 */
export class JudgeEvaluator {
  #agentClient;
  #llmToken;
  #model;
  #evaluationTemplate;

  /**
   * Create a new JudgeEvaluator instance
   * @param {import('@copilot-ld/librpc').AgentClient} agentClient - Agent client for evaluation
   * @param {string} llmToken - LLM token for API access
   * @param {string} model - Model to use for judge evaluations
   */
  constructor(agentClient, llmToken, model) {
    if (!agentClient) throw new Error("agentClient is required");
    if (!llmToken) throw new Error("llmToken is required");
    if (!model) throw new Error("model is required");

    this.#agentClient = agentClient;
    this.#llmToken = llmToken;
    this.#model = model;

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(__dirname, "./templates/evaluation.md.mustache");
    this.#evaluationTemplate = readFileSync(templatePath, "utf8");
  }

  /**
   * Build the evaluation message content
   * @param {string} prompt - Original user prompt
   * @param {string} responseContent - Agent's response content
   * @param {object[]} evaluations - Array of evaluation criteria
   * @returns {string} Formatted evaluation message
   */
  #buildEvaluationMessage(prompt, responseContent, evaluations) {
    const evaluationsWithIndex = evaluations.map((evaluation, index) => ({
      ...evaluation,
      index,
    }));

    return mustache.render(this.#evaluationTemplate, {
      prompt,
      response: responseContent,
      evaluations: evaluationsWithIndex,
    });
  }

  /**
   * Request judgment from the judge agent and parse JSON response
   * @param {string} evaluationContent - The evaluation message content
   * @param {string} scenarioName - Name of the scenario for error messages
   * @param {object[]} evaluations - Array of evaluation criteria
   * @returns {Promise<object>} Parsed judgment object
   * @throws {Error} If JSON parsing fails
   */
  async #requestJudgment(evaluationContent, scenarioName, evaluations) {
    const request = agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({ role: "user", content: evaluationContent }),
      ],
      llm_token: this.#llmToken,
      model: this.#model,
      agent_id: `common.Agent.eval_judge`,
    });

    const judgment = await this.#agentClient.ProcessUnary(request);

    if (!judgment.messages || judgment.messages.length === 0) {
      throw new Error(
        `No messages returned from agent for ${scenarioName}. Response: ${JSON.stringify(judgment).substring(0, 200)}`,
      );
    }

    const judgmentAssistantMessages = judgment.messages.filter(
      (m) => m.role === "assistant" && m.content && m.content.trim().length > 0,
    );
    if (judgmentAssistantMessages.length === 0) {
      throw new Error(
        `No assistant messages in judgment for ${scenarioName}. Total messages: ${judgment.messages.length}`,
      );
    }

    const content =
      judgmentAssistantMessages[judgmentAssistantMessages.length - 1].content;
    let judgmentContent = content.trim();

    // Extract JSON from response
    const jsonMatch = judgmentContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      judgmentContent = jsonMatch[0];
    }

    // Parse JSON response - throws on failure
    const parsedJudgment = JSON.parse(judgmentContent);

    // Validate all criteria are present
    for (let i = 0; i < evaluations.length; i++) {
      const result = parsedJudgment[i.toString()] || parsedJudgment[i];
      if (!result) {
        const actualKeys = Object.keys(parsedJudgment).join(", ");
        throw new Error(
          `Missing judgment for criteria index ${i} ("${evaluations[i].label}"). Received keys: ${actualKeys}`,
        );
      }
    }

    return parsedJudgment;
  }

  /**
   * Evaluate agent response against criteria
   * @param {object} scenario - Scenario with evaluations array
   * @param {object} response - Agent response object
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(scenario, response) {
    if (!scenario.evaluations || scenario.evaluations.length === 0) {
      throw new Error(`Scenario ${scenario.name} missing evaluations`);
    }

    if (!response.messages || response.messages.length === 0) {
      throw new Error(`No messages in agent response for ${scenario.name}`);
    }

    const assistantMessages = response.messages.filter(
      (m) => m.role === "assistant" && m.content && m.content.trim().length > 0,
    );
    if (assistantMessages.length === 0) {
      throw new Error(
        `No assistant messages with content in agent response for ${scenario.name}. Total messages: ${response.messages.length}`,
      );
    }

    const responseContent =
      assistantMessages[assistantMessages.length - 1].content;

    const evaluationContent = this.#buildEvaluationMessage(
      scenario.prompt,
      responseContent,
      scenario.evaluations,
    );

    // Retry judgment request up to 3 times on JSON parse failure
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const parsedJudgment = await this.#requestJudgment(
          evaluationContent,
          scenario.name,
          scenario.evaluations,
        );

        const evaluationResults = scenario.evaluations.map(
          (evaluation, index) => {
            const result =
              parsedJudgment[index.toString()] || parsedJudgment[index];
            return {
              label: evaluation.label,
              data: evaluation.data,
              passed: result.passed,
              detail: result.judgement,
            };
          },
        );

        return {
          scenario: scenario.name,
          type: "criteria",
          passed: evaluationResults.every((r) => r.passed),
          prompt: scenario.prompt,
          response: responseContent,
          evaluations: evaluationResults,
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          continue;
        }
      }
    }

    throw new Error(
      `Failed to parse judgment JSON for ${scenario.name} after ${maxRetries} attempts: ${lastError.message}`,
    );
  }
}
