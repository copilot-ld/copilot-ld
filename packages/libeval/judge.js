/* eslint-env node */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import mustache from "mustache";

import { ParseError } from "./error.js";
import { createLlm } from "@copilot-ld/libcopilot";
import { common } from "@copilot-ld/libtype";

/**
 * Judge-based evaluator using LLM
 * Evaluates agent responses against natural language criteria
 */
export class JudgeEvaluator {
  #copilot;
  #criteriaTemplate;

  /**
   * Create a new JudgeEvaluator instance
   * @param {string} githubToken - GitHub token for API access
   * @param {string} model - Model to use for judge evaluations
   */
  constructor(githubToken, model) {
    if (!githubToken) throw new Error("githubToken is required");
    if (!model) throw new Error("model is required");

    this.#copilot = createLlm(githubToken, model);

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(__dirname, "./prompts/criteria.md.mustache");
    this.#criteriaTemplate = readFileSync(templatePath, "utf8");
  }

  /**
   * Evaluate agent responses against criteria
   * @param {object} scenario - Scenario with evaluations array
   * @param {string[]} responses - Array of response strings from agent
   * @returns {Promise<object>} Evaluation result with passed and evaluations
   */
  async evaluate(scenario, responses) {
    if (!scenario.evaluations || scenario.evaluations.length === 0) {
      throw new Error(`Scenario ${scenario.name} missing evaluations`);
    }

    if (!responses || responses.length === 0) {
      throw new Error(`No responses from agent for ${scenario.name}`);
    }

    // Concatenate all responses for judgment
    const responseContent = responses.join("\n\n---\n\n");

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

    const messages = [
      common.Message.fromObject({
        role: "user",
        content: evaluationPrompt,
      }),
    ];

    const judgment = await this.#copilot.createCompletions({ messages });
    const judgmentContent = judgment.choices[0].message.content.trim();

    // Parse JSON response
    let parsedJudgment;
    try {
      parsedJudgment = JSON.parse(judgmentContent);
    } catch (error) {
      throw new ParseError(
        `Failed to parse judgment JSON for ${scenario.name}: ${error.message}`,
        { cause: error },
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
      passed,
      evaluations: evaluationResults,
    };
  }
}
