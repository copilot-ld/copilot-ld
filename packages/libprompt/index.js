/* eslint-env node */
import crypto from "crypto";

import * as libtype from "@copilot-ld/libtype";

/**
 * Prompt data container with system instructions, similarities, and messages
 */
export class Prompt {
  /**
   * Creates a new Prompt instance
   * @param {object} params - Prompt parameters
   * @param {string[]} params.system_instructions - Array of system instruction strings
   * @param {libtype.Similarity[]} params.previous_similarities - Array of Similarity objects from past searches
   * @param {libtype.Similarity[]} params.current_similarities - Array of Similarity objects from current search
   * @param {libtype.Message[]} params.messages - Array of Message objects (user/assistant conversation)
   */
  constructor({
    system_instructions = [],
    previous_similarities = [],
    current_similarities = [],
    messages = [],
  }) {
    this.system_instructions = system_instructions;
    this.previous_similarities = previous_similarities;
    this.current_similarities = current_similarities;
    this.messages = messages;
  }

  /**
   * Checks if the prompt is empty (no messages or context)
   * @returns {boolean} True if prompt has no content
   */
  isEmpty() {
    return (
      this.messages.length === 0 &&
      this.current_similarities.length === 0 &&
      this.previous_similarities.length === 0
    );
  }

  /**
   * Converts prompt to ordered messages array for LLM consumption
   * @returns {libtype.Message[]} Array of properly ordered Message objects
   */
  toMessages() {
    const messages = [];

    // System instructions first (ensure it's an array)
    const instructions = Array.isArray(this.system_instructions)
      ? this.system_instructions
      : [];
    instructions.forEach((instruction) => {
      messages.push(
        new libtype.Message({ role: "system", content: instruction }),
      );
    });

    // Context from similarities (current emphasized over previous)
    if (this.current_similarities.length > 0) {
      messages.push(
        new libtype.Message({
          role: "system",
          content: `Current context:\n${this.current_similarities.map((s) => s.text).join("\n\n")}`,
        }),
      );
    }

    if (this.previous_similarities.length > 0) {
      messages.push(
        new libtype.Message({
          role: "system",
          content: `Previous context:\n${this.previous_similarities.map((s) => s.text).join("\n\n")}`,
        }),
      );
    }

    // Conversation messages last
    messages.push(...this.messages);
    return messages;
  }
}

/**
 * Stateless builder for creating and updating prompts
 */
export class PromptAssembler {
  /**
   * Builds a request prompt by appending new user message to existing conversation
   * @param {Prompt} existingPrompt - Current prompt state from history
   * @param {libtype.Message} newUserMessage - User message to append
   * @param {libtype.Similarity[]} current_similarities - Similar content from vector search
   * @param {string[]} system_instructions - System instructions to include
   * @returns {Prompt} New prompt ready for LLM processing
   */
  static buildRequest(
    existingPrompt,
    newUserMessage,
    current_similarities,
    system_instructions,
  ) {
    return new Prompt({
      system_instructions: system_instructions || [],
      previous_similarities: existingPrompt?.previous_similarities || [],
      current_similarities: current_similarities,
      messages: [...(existingPrompt?.messages || []), newUserMessage],
    });
  }

  /**
   * Updates prompt after receiving assistant response
   * @param {Prompt} prompt - Current prompt
   * @param {libtype.Message} assistantMessage - Assistant response message
   * @returns {Prompt} Updated prompt with response and moved similarities
   */
  static updateWithResponse(prompt, assistantMessage) {
    return new Prompt({
      system_instructions: prompt.system_instructions,
      previous_similarities: [
        ...prompt.previous_similarities,
        ...prompt.current_similarities,
      ],
      current_similarities: [], // Clear current, move to previous
      messages: [...prompt.messages, assistantMessage],
    });
  }
}

/**
 * Async prompt optimizer for token management and summarization
 */
export class PromptOptimizer {
  #llmFactory;
  #config;

  /**
   * Creates a new PromptOptimizer instance
   * @param {Function} llmFactory - Factory function to create LLM instances
   * @param {object} config - Configuration object
   * @param {number} config.totalTokenLimit - Total token limit
   * @param {number} config.systemInstructionsPercent - Percentage for system instructions
   * @param {number} config.previousSimilaritiesPercent - Percentage for previous similarities
   * @param {number} config.currentSimilaritiesPercent - Percentage for current similarities
   * @param {number} config.messagesPercent - Percentage for messages
   */
  constructor(llmFactory, config = {}) {
    this.#llmFactory = llmFactory;
    this.#config = {
      totalTokenLimit: 100000,
      systemInstructionsPercent: 0.02,
      previousSimilaritiesPercent: 0.15,
      currentSimilaritiesPercent: 0.6,
      messagesPercent: 0.23,
      ...config,
    };
  }

  /**
   * Optimizes a prompt by managing token limits and summarization
   * @param {Prompt} prompt - Prompt to optimize
   * @param {string} githubToken - GitHub token for LLM access
   * @returns {Promise<Prompt>} Optimized prompt
   */
  async optimize(prompt, githubToken) {
    const llm = this.#llmFactory(githubToken);

    // Calculate token usage
    const tokenCounts = await this.#calculateTokenCounts(prompt, llm);

    // If within limits, return as-is
    if (this.#isWithinLimits(tokenCounts)) {
      return prompt;
    }

    // Summarize sections that exceed limits
    return await this.#summarizeSections(prompt, tokenCounts, llm);
  }

  /**
   * Calculates token counts for all sections of the prompt
   * @param {Prompt} prompt - Prompt to analyze
   * @param {object} llm - LLM instance for token counting
   * @returns {Promise<object>} Token counts for each section
   * @private
   */
  async #calculateTokenCounts(prompt, llm) {
    return {
      systemInstructions: prompt.system_instructions.reduce(
        (sum, inst) => sum + llm.countTokens(inst),
        0,
      ),
      previousSimilarities: prompt.previous_similarities.reduce(
        (sum, sim) => sum + (sim.tokens || llm.countTokens(sim.text || "")),
        0,
      ),
      currentSimilarities: prompt.current_similarities.reduce(
        (sum, sim) => sum + (sim.tokens || llm.countTokens(sim.text || "")),
        0,
      ),
      messages: prompt.messages.reduce(
        (sum, msg) => sum + llm.countTokens(`${msg.role}: ${msg.content}`),
        0,
      ),
    };
  }

  /**
   * Checks if token counts are within configured limits
   * @param {object} tokenCounts - Token counts for each section
   * @returns {boolean} True if within limits
   * @private
   */
  #isWithinLimits(tokenCounts) {
    const total = Object.values(tokenCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    return total <= this.#config.totalTokenLimit;
  }

  /**
   * Summarizes sections that exceed their allocated token limits
   * @param {Prompt} prompt - Original prompt
   * @param {object} _tokenCounts - Current token counts (unused in current implementation)
   * @param {object} _llm - LLM instance for summarization (unused in current implementation)
   * @returns {Promise<Prompt>} Prompt with summarized sections
   * @private
   */
  async #summarizeSections(prompt, _tokenCounts, _llm) {
    // For now, return original prompt as fallback
    // Full implementation would involve sophisticated summarization logic
    console.warn(
      "[PromptOptimizer] Optimization not fully implemented, returning original prompt",
    );
    return prompt;
  }
}

/**
 * Storage implementation for Prompt objects
 */
export class PromptStorage {
  #storage;

  /**
   * Creates a new PromptStorage instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage backend implementation
   */
  constructor(storage) {
    if (!storage) throw new Error("storage is required");
    this.#storage = storage;
  }

  /**
   * Retrieves a prompt for the given session ID
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Prompt>} Prompt object or empty prompt for new sessions
   */
  async get(sessionId) {
    try {
      const data = await this.#storage.get(`${sessionId}.json`);
      const parsed = JSON.parse(data.toString());
      return new Prompt(parsed);
    } catch {
      return new Prompt({});
    }
  }

  /**
   * Stores a prompt for the given session ID
   * @param {string} sessionId - Session identifier
   * @param {Prompt} prompt - Prompt object to store
   * @returns {Promise<void>}
   */
  async store(sessionId, prompt) {
    const data = JSON.stringify(prompt, null, 2);
    await this.#storage.put(`${sessionId}.json`, data);
  }
}

/**
 * Generates a unique session ID for conversation tracking
 * @returns {string} Unique session identifier
 */
export function generateSessionId() {
  return crypto.randomUUID();
}

/**
 * Finds the most recent user message in a conversation
 * @param {libtype.Message[]} messages - Array of conversation messages
 * @returns {libtype.Message|null} Latest user message or null if none found
 */
export function getLatestUserMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  // Find the last message with role "user"
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i];
    }
  }

  return null;
}
