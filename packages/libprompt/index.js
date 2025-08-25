/* eslint-env node */
import crypto from "node:crypto";
import { common } from "@copilot-ld/libtype";

/** @typedef {import("@copilot-ld/libstorage").StorageInterface} StorageInterface */
/**
 * @deprecated The Message type will be replaced by MessageV2 in the new resource-based architecture
 * @typedef {import("@copilot-ld/libtype").common.Message} common.Message
 */
/** @typedef {import("@copilot-ld/libtype").common.Prompt} common.Prompt */
/** @typedef {import("@copilot-ld/libtype").common.Similarity} common.Similarity */

/**
 * Stateless builder for creating and updating prompts
 * @deprecated This class will be replaced by `libresource` and new abstract types in the resource-based architecture
 */
export class PromptAssembler {
  /**
   * Builds a request prompt by appending new user message to existing conversation
   * @param {common.Prompt} existingPrompt - Current prompt state from history
   * @param {common.Message} newUserMessage - User message to append
   * @param {common.Similarity[]} current_similarities - Similar content from vector search
   * @param {string[]} system_instructions - System instructions to include
   * @returns {common.Prompt} New prompt ready for LLM processing
   */
  static buildRequest(
    existingPrompt,
    newUserMessage,
    current_similarities,
    system_instructions,
  ) {
    return new common.Prompt({
      system_instructions: system_instructions || [],
      previous_similarities: existingPrompt?.previous_similarities || [],
      current_similarities: current_similarities,
      messages: [...(existingPrompt?.messages || []), newUserMessage],
    });
  }

  /**
   * Updates prompt after receiving assistant response
   * @param {common.Prompt} prompt - Current prompt
   * @param {common.Message} assistantMessage - Assistant response message
   * @returns {common.Prompt} Updated prompt with response and moved similarities
   */
  static updateWithResponse(prompt, assistantMessage) {
    return new common.Prompt({
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
 * @deprecated This class will be replaced by `libresource` and new abstract types in the resource-based architecture
 */
export class PromptOptimizer {
  #llmFactory;
  #config;

  /**
   * Creates a new PromptOptimizer instance
   * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - Factory to create LLM instances
   * @param {object} config - Configuration object
   * @param {number} [config.totalTokenLimit] - Total token limit
   * @param {number} [config.systemInstructionsPercent] - Percentage for system instructions
   * @param {number} [config.previousSimilaritiesPercent] - Percentage for previous similarities
   * @param {number} [config.currentSimilaritiesPercent] - Percentage for current similarities
   * @param {number} [config.messagesPercent] - Percentage for messages
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
   * @param {common.Prompt} prompt - Prompt to optimize
   * @param {string} githubToken - GitHub token for LLM access
   * @returns {Promise<common.Prompt>} Optimized prompt
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
   * @param {common.Prompt} prompt - Prompt to analyze
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
   * @param {common.Prompt} prompt - Original prompt
   * @param {object} _tokenCounts - Current token counts (unused here)
   * @param {object} _llm - LLM instance (unused here)
   * @returns {Promise<common.Prompt>} Prompt with summarized sections
   * @private
   */
  async #summarizeSections(prompt, _tokenCounts, _llm) {
    // Placeholder summarization - return original for now
    console.warn(
      "[PromptOptimizer] Optimization not fully implemented, returning original prompt",
    );
    return prompt;
  }
}

/**
 * Storage implementation for Prompt objects
 * @deprecated This class will be replaced by `libresource` and new abstract types in the resource-based architecture
 */
export class PromptStorage {
  #storage;

  /**
   * Creates a new PromptStorage instance
   * @param {StorageInterface} storage - Storage backend implementation
   */
  constructor(storage) {
    if (!storage) throw new Error("storage is required");
    this.#storage = storage;
  }

  /**
   * Retrieves a prompt for the given session ID
   * @param {string} sessionId - Session identifier
   * @returns {Promise<common.Prompt>} Prompt object or empty prompt
   */
  async get(sessionId) {
    try {
      const data = await this.#storage.get(`${sessionId}.json`);
      const parsed = JSON.parse(data.toString());
      return new common.Prompt(parsed);
    } catch {
      return new common.Prompt({});
    }
  }

  /**
   * Stores a prompt for the given session ID
   * @param {string} sessionId - Session identifier
   * @param {common.Prompt} prompt - Prompt object to store
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
 * @deprecated This function will be replaced by `libresource` and new abstract types in the resource-based architecture
 */
export function generateSessionId() {
  return crypto.randomUUID();
}

/**
 * Finds the most recent user message in a conversation
 * @param {common.Message[]} messages - Array of conversation messages
 * @returns {common.Message|null} Latest user message or null if none found
 * @deprecated This function will be replaced by `libresource` and new abstract types in the resource-based architecture
 */
export function getLatestUserMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i];
    }
  }
  return null;
}
