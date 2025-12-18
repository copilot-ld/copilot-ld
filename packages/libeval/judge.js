/* eslint-env node */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import mustache from "mustache";
import { generateUUID } from "@copilot-ld/libutil";
import { common, llm, memory } from "@copilot-ld/libtype";

/**
 * Judge-based evaluator using LLM
 * Evaluates agent responses against natural language criteria
 */
export class JudgeEvaluator {
  #llmClient;
  #memoryClient;
  #resourceIndex;
  #githubToken;
  #model;
  #criteriaTemplate;

  /**
   * Create a new JudgeEvaluator instance
   * @param {import('@copilot-ld/librpc').LlmClient} llmClient - LLM client for evaluation
   * @param {import('@copilot-ld/librpc').MemoryClient} memoryClient - Memory client for storing evaluation messages
   * @param {import('@copilot-ld/libresource').ResourceIndex} resourceIndex - Resource index for storing conversation
   * @param {string} githubToken - GitHub token for API access
   * @param {string} model - Model to use for judge evaluations
   */
  constructor(llmClient, memoryClient, resourceIndex, githubToken, model) {
    if (!llmClient) throw new Error("llmClient is required");
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!githubToken) throw new Error("githubToken is required");
    if (!model) throw new Error("model is required");

    this.#llmClient = llmClient;
    this.#memoryClient = memoryClient;
    this.#resourceIndex = resourceIndex;
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

    // Use judge_evaluator assistant (has no tools, just returns JSON)
    const assistantId = "common.Assistant.judge_evaluator";

    // Create a new conversation for this evaluation
    const conversation = common.Conversation.fromObject({
      id: {
        name: generateUUID(),
      },
      assistant_id: assistantId,
    });

    // Store conversation resource
    await this.#resourceIndex.put(conversation);

    const evaluationResourceId = String(conversation.id);

    // Create and store the evaluation message
    const evaluationMessage = common.Message.fromObject({
      role: "user",
      content: evaluationPrompt,
    });
    evaluationMessage.withIdentifier(conversation.id);

    // Store the message resource
    await this.#resourceIndex.put(evaluationMessage);

    // Append the evaluation message to memory
    await this.#memoryClient.AppendMemory(
      memory.AppendRequest.fromObject({
        resource_id: evaluationResourceId,
        identifiers: [evaluationMessage.id],
      }),
    );

    const request = llm.CompletionsRequest.fromObject({
      resource_id: evaluationResourceId,
      model: this.#model,
      github_token: this.#githubToken,
    });

    const judgment = await this.#llmClient.CreateCompletions(request);

    // Validate response structure
    if (!judgment.choices || judgment.choices.length === 0) {
      throw new Error(
        `No choices returned from LLM for ${scenario.name}. Response: ${JSON.stringify(judgment).substring(0, 200)}`,
      );
    }

    const content = judgment.choices[0].message?.content;
    if (!content || content.trim().length === 0) {
      throw new Error(
        `Empty content from LLM for ${scenario.name}. Choice: ${JSON.stringify(judgment.choices[0]).substring(0, 200)}`,
      );
    }

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
