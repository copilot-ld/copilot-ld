/* eslint-env node */
import { common, llm } from "@copilot-ld/libtype";

/**
 * LLM-as-a-judge implementation for evaluating agent responses
 * Uses an LLM to score responses on multiple quality dimensions
 */
export class Judge {
  #llmClient;
  #githubToken;

  /**
   * Create a new Judge instance for evaluating agent responses
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
   * Evaluate all metrics for a response
   * @param {string} query - Original user query
   * @param {string} response - Agent response to evaluate
   * @param {string} groundTruth - Expected correct information
   * @param {string[]} expectedTopics - Topics that should be covered
   * @returns {Promise<object>} Scores for all metrics
   */
  async evaluateAll(query, response, groundTruth, expectedTopics = []) {
    const [relevance, accuracy, completeness, coherence, sourceAttribution] =
      await Promise.all([
        this.evaluateRelevance(query, response),
        this.evaluateAccuracy(response, groundTruth),
        this.evaluateCompleteness(query, response, expectedTopics),
        this.evaluateCoherence(response),
        this.evaluateSourceAttribution(response),
      ]);

    return {
      relevance,
      accuracy,
      completeness,
      coherence,
      sourceAttribution,
      average:
        (relevance + accuracy + completeness + coherence + sourceAttribution) /
        5,
    };
  }

  /**
   * Evaluate relevance: Does the response address the user's question?
   * @param {string} query - Original user query
   * @param {string} response - Agent response to evaluate
   * @returns {Promise<number>} Score from 0-10
   */
  async evaluateRelevance(query, response) {
    const prompt = `Evaluate the relevance of this response to the user's query.

Query: ${query}

Response: ${response}

Rate from 0-10 where:
- 0 = Completely irrelevant, does not address the query at all
- 5 = Partially relevant, addresses some aspects but misses key points
- 10 = Perfectly relevant, directly and fully addresses the query

Provide your rating as a single number (0-10) followed by a brief explanation.
Format: SCORE: X
Reasoning: [your explanation]`;

    return this.#extractScore(await this.#evaluateWithLLM(prompt));
  }

  /**
   * Evaluate accuracy: Are the facts and information correct?
   * @param {string} response - Agent response to evaluate
   * @param {string} groundTruth - Expected correct information
   * @returns {Promise<number>} Score from 0-10
   */
  async evaluateAccuracy(response, groundTruth) {
    const prompt = `Evaluate the factual accuracy of this response against the ground truth.

Ground Truth: ${groundTruth}

Response: ${response}

Rate from 0-10 where:
- 0 = Contains major factual errors or contradicts ground truth
- 5 = Mostly accurate but has some minor errors or omissions
- 10 = Completely accurate, all facts align with ground truth

Provide your rating as a single number (0-10) followed by a brief explanation.
Format: SCORE: X
Reasoning: [your explanation]`;

    return this.#extractScore(await this.#evaluateWithLLM(prompt));
  }

  /**
   * Evaluate completeness: Does the response cover all aspects of the question?
   * @param {string} query - Original user query
   * @param {string} response - Agent response to evaluate
   * @param {string[]} expectedTopics - Topics that should be covered
   * @returns {Promise<number>} Score from 0-10
   */
  async evaluateCompleteness(query, response, expectedTopics = []) {
    const topicsSection =
      expectedTopics.length > 0
        ? `\n\nExpected Topics to Cover:\n${expectedTopics.map((t) => `- ${t}`).join("\n")}`
        : "";

    const prompt = `Evaluate the completeness of this response.

Query: ${query}${topicsSection}

Response: ${response}

Rate from 0-10 where:
- 0 = Incomplete, misses all major aspects
- 5 = Covers some aspects but significant gaps remain
- 10 = Comprehensive, covers all aspects thoroughly

Provide your rating as a single number (0-10) followed by a brief explanation.
Format: SCORE: X
Reasoning: [your explanation]`;

    return this.#extractScore(await this.#evaluateWithLLM(prompt));
  }

  /**
   * Evaluate coherence: Is the response well-structured and logically organized?
   * @param {string} response - Agent response to evaluate
   * @returns {Promise<number>} Score from 0-10
   */
  async evaluateCoherence(response) {
    const prompt = `Evaluate the coherence and structure of this response.

Response: ${response}

Rate from 0-10 where:
- 0 = Incoherent, confusing, poorly organized
- 5 = Somewhat coherent but could be better organized
- 10 = Perfectly coherent, well-structured, logically organized

Provide your rating as a single number (0-10) followed by a brief explanation.
Format: SCORE: X
Reasoning: [your explanation]`;

    return this.#extractScore(await this.#evaluateWithLLM(prompt));
  }

  /**
   * Evaluate source attribution: Does the response properly cite/reference sources?
   * @param {string} response - Agent response to evaluate
   * @returns {Promise<number>} Score from 0-10
   */
  async evaluateSourceAttribution(response) {
    const prompt = `Evaluate the source attribution in this response.

Response: ${response}

Rate from 0-10 where:
- 0 = No sources cited, no attribution
- 5 = Some sources mentioned but incomplete or unclear attribution
- 10 = Proper source attribution, clear references to information sources

Provide your rating as a single number (0-10) followed by a brief explanation.
Format: SCORE: X
Reasoning: [your explanation]`;

    return this.#extractScore(await this.#evaluateWithLLM(prompt));
  }

  /**
   * Use LLM to evaluate with given prompt
   * @param {string} prompt - Evaluation prompt
   * @returns {Promise<string>} LLM response
   */
  async #evaluateWithLLM(prompt) {
    const request = llm.CompletionsRequest.fromObject({
      messages: [common.Message.fromObject({ role: "user", content: prompt })],
      temperature: 0.0,
      github_token: this.#githubToken,
    });

    const response = await this.#llmClient.CreateCompletions(request);
    return response.choices[0].message.content.text;
  }

  /**
   * Extract numeric score from LLM response
   * @param {string} response - LLM response containing score
   * @returns {number} Extracted score (0-10)
   */
  #extractScore(response) {
    // Look for "SCORE: X" pattern
    const scoreMatch = response.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      const score = parseFloat(scoreMatch[1]);
      return Math.max(0, Math.min(10, score));
    }

    // Fallback: look for any number at the start
    const numberMatch = response.match(/^(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      const score = parseFloat(numberMatch[1]);
      return Math.max(0, Math.min(10, score));
    }

    // If no number found, return 0
    console.warn("Could not extract score from response:", response);
    return 0;
  }
}
