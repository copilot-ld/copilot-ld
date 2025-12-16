/* eslint-env node */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import mustache from "mustache";
import { common, llm } from "@copilot-ld/libtype";

/**
 * Judge-based evaluator using LLM
 * Evaluates agent responses against natural language criteria
 */
export class JudgeEvaluator {
  #llmClient;
  #githubToken;
  #model;
  #criteriaTemplate;

  /**
   * Create a new JudgeEvaluator instance
   * @param {import('@copilot-ld/librpc').LlmClient} llmClient - LLM client for evaluation
   * @param {string} githubToken - GitHub token for API access
   * @param {string} model - Model to use for judge evaluations
   */
  constructor(llmClient, githubToken, model) {
    if (!llmClient) throw new Error("llmClient is required");
    if (!githubToken) throw new Error("githubToken is required");
    if (!model) throw new Error("model is required");

    this.#llmClient = llmClient;
    this.#githubToken = githubToken;
    this.#model = model;

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(__dirname, "./prompts/criteria.md.mustache");
    this.#criteriaTemplate = readFileSync(templatePath, "utf8");
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

    // Get the last assistant message as the response content
    const assistantMessages = response.messages.filter(
      (m) => m.role === "assistant",
    );
    if (assistantMessages.length === 0) {
      throw new Error(
        `No assistant messages in agent response for ${scenario.name}`,
      );
    }

    const responseContent = assistantMessages[assistantMessages.length - 1].content;

    // Add indices to evaluations for template rendering
    const evaluationsWithIndex = scenario.evaluations.map(
      (evaluation, index) => ({
        ...evaluation,
        index,
      }),
    );

    // Render evaluation prompt with all criteria
    const evaluationPrompt = mustache.render(this.#criteriaTemplate, {
      prompt: scenario.prompt,
      response: responseContent,
      evaluations: evaluationsWithIndex,
    });

    const request = llm.CompletionsRequest.fromObject({
      model: this.#model,
      messages: [
        common.Message.fromObject({
          role: "user",
          content: evaluationPrompt,
        }),
      ],
      temperature: 0.0,
      github_token: this.#githubToken,
    });

    const judgment = await this.#llmClient.CreateCompletions(request);
    const judgmentContent = judgment.choices[0].message.content.trim();

    // Parse JSON response
    let parsedJudgment;
    try {
      parsedJudgment = JSON.parse(judgmentContent);
    } catch (error) {
      throw new Error(
        `Failed to parse judgment JSON for ${scenario.name}: ${error.message}`,
      );
    }

    // Build evaluation results from parsed JSON
    const evaluationResults = scenario.evaluations.map((evaluation, index) => {
      const result = parsedJudgment[index.toString()];
      if (!result) {
        throw new Error(
          `Missing judgment for criteria index ${index} ("${evaluation.label}") in scenario ${scenario.name}`,
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
