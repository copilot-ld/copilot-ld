/* eslint-env node */
import { common, llm } from "@copilot-ld/libtype";

/**
 * Criteria-based evaluator using LLM judge
 * Evaluates agent responses against natural language criteria
 */
export class CriteriaEvaluator {
  #llmClient;
  #githubToken;

  /**
   * Create a new CriteriaEvaluator instance
   * @param {import('@copilot-ld/librpc').LlmClient} llmClient - LLM client for evaluation
   * @param {string} githubToken - GitHub token for API access
   */
  constructor(llmClient, githubToken) {
    if (!llmClient) throw new Error("llmClient is required");
    if (!githubToken) throw new Error("githubToken is required");

    this.#llmClient = llmClient;
    this.#githubToken = githubToken;
  }

  /**
   * Evaluate agent response against criteria
   * @param {object} testCase - Test case with criteria
   * @param {object} response - Agent response object
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(testCase, response) {
    if (!testCase.criteria) {
      throw new Error(`Test case ${testCase.id} missing criteria`);
    }

    if (!response.choices || response.choices.length === 0) {
      throw new Error(`No choices in agent response for ${testCase.id}`);
    }

    const responseContent = response.choices[0].message.content.text;

    const prompt = `Evaluate if this response meets the criteria.

Query: ${testCase.query}
Response: ${responseContent}
Criteria: ${testCase.criteria}

Respond with only "PASS" or "FAIL" followed by a brief explanation.`;

    const request = llm.CompletionsRequest.fromObject({
      messages: [common.Message.fromObject({ role: "user", content: prompt })],
      temperature: 0.0,
      github_token: this.#githubToken,
    });

    const judgment = await this.#llmClient.CreateCompletions(request);
    const result = judgment.choices[0].message.content.text;
    // Remove markdown formatting and check for PASS/FAIL
    const cleanResult = result.trim().replace(/^\*\*|\*\*$/g, "").toUpperCase();
    const passed = cleanResult.startsWith("PASS");

    return {
      caseId: testCase.id,
      type: "criteria",
      passed,
      judgment: result,
      query: testCase.query,
      response: responseContent,
    };
  }
}
