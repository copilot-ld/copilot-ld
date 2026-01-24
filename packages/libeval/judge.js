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

    // Get the last assistant message with content as the response
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

    // Build the evaluation message
    const evaluationContent = this.#buildEvaluationMessage(
      scenario.prompt,
      responseContent,
      scenario.evaluations,
    );

    // Create agent request with judge_evaluator assistant
    const request = agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({ role: "user", content: evaluationContent }),
      ],
      llm_token: this.#llmToken,
      model: this.#model,
      agent_id: `common.Agent.eval_judge`,
    });

    const judgment = await this.#agentClient.ProcessUnary(request);

    // Validate response structure
    if (!judgment.messages || judgment.messages.length === 0) {
      throw new Error(
        `No messages returned from agent for ${scenario.name}. Response: ${JSON.stringify(judgment).substring(0, 200)}`,
      );
    }

    // Get the last assistant message from the judgment
    const judgmentAssistantMessages = judgment.messages.filter(
      (m) => m.role === "assistant" && m.content && m.content.trim().length > 0,
    );
    if (judgmentAssistantMessages.length === 0) {
      throw new Error(
        `No assistant messages in judgment for ${scenario.name}. Total messages: ${judgment.messages.length}`,
      );
    }

    const content =
      judgmentAssistantMessages[judgmentAssistantMessages.length - 1].content;
    let judgmentContent = content.trim();

    // Strip any conversational prefix before JSON (e.g., "Understood. ", "Sure! ")
    const jsonMatch = judgmentContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      judgmentContent = jsonMatch[0];
    }

    // Parse JSON response
    let parsedJudgment;
    try {
      parsedJudgment = JSON.parse(judgmentContent);
    } catch (error) {
      throw new Error(
        `Failed to parse judgment JSON for ${scenario.name}: ${error.message}. Content: ${judgmentContent.substring(0, 200)}`,
      );
    }

    // Build evaluation results from parsed JSON
    const evaluationResults = scenario.evaluations.map((evaluation, index) => {
      // Try both string and numeric keys for flexibility
      const result = parsedJudgment[index.toString()] || parsedJudgment[index];
      if (!result) {
        // Log the actual keys to help debug
        const actualKeys = Object.keys(parsedJudgment).join(", ");
        throw new Error(
          `Missing judgment for criteria index ${index} ("${evaluation.label}") in scenario ${scenario.name}. Received keys: ${actualKeys}`,
        );
      }

      return {
        label: evaluation.label,
        data: evaluation.data,
        passed: result.passed,
        detail: result.judgement,
      };
    });

    const passed = evaluationResults.every((r) => r.passed);

    return {
      scenario: scenario.name,
      type: "criteria",
      passed,
      prompt: scenario.prompt,
      response: responseContent,
      evaluations: evaluationResults,
    };
  }
}
