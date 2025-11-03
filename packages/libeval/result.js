/* eslint-env node */

/**
 * Standardized evaluation result with consistent contract
 * Encapsulates test case evaluation outcomes with metadata
 */
export class EvaluationResult {
  #caseId;
  #type;
  #passed;
  #query;
  #conversationId;
  #details;

  /**
   * Create a new EvaluationResult instance
   * @param {string} caseId - Test case identifier
   * @param {string} type - Evaluation type (criteria, retrieval, trace)
   * @param {boolean} passed - Whether the evaluation passed
   * @param {string} query - Original query text
   * @param {string} conversationId - Conversation resource ID for debugging
   * @param {object} details - Type-specific evaluation details
   */
  constructor(caseId, type, passed, query, conversationId, details) {
    if (!caseId) throw new Error("caseId is required");
    if (!type) throw new Error("type is required");
    if (passed === undefined) throw new Error("passed is required");
    if (!query) throw new Error("query is required");
    if (!details) throw new Error("details is required");

    this.#caseId = caseId;
    this.#type = type;
    this.#passed = passed;
    this.#query = query;
    this.#conversationId = conversationId;
    this.#details = details;
  }

  /**
   * Get test case identifier
   * @returns {string} Case ID
   */
  get caseId() {
    return this.#caseId;
  }

  /**
   * Get evaluation type
   * @returns {string} Type (criteria, retrieval, trace)
   */
  get type() {
    return this.#type;
  }

  /**
   * Check if evaluation passed
   * @returns {boolean} Pass status
   */
  get passed() {
    return this.#passed;
  }

  /**
   * Get original query text
   * @returns {string} Query
   */
  get query() {
    return this.#query;
  }

  /**
   * Get conversation resource ID
   * @returns {string} Conversation ID
   */
  get conversationId() {
    return this.#conversationId;
  }

  /**
   * Get type-specific details
   * @returns {object} Evaluation details
   */
  get details() {
    return this.#details;
  }

  /**
   * Convert result to plain object for serialization
   * @returns {object} Plain object representation
   */
  toJSON() {
    return {
      caseId: this.#caseId,
      type: this.#type,
      passed: this.#passed,
      query: this.#query,
      conversationId: this.#conversationId,
      ...this.#details,
    };
  }
}
