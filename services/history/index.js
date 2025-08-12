/* eslint-env node */
import { Prompt } from "@copilot-ld/libprompt";
import { Service } from "@copilot-ld/libservice";

import { HistoryServiceInterface } from "./types.js";

/**
 * Chat history management service with prompt storage and optimization
 * @implements {HistoryServiceInterface}
 */
class HistoryService extends Service {
  #promptStorage;
  #promptOptimizer;

  /**
   * Creates a new History service instance
   * @param {object} config - Service configuration object
   * @param {import("@copilot-ld/libprompt").PromptStorage} promptStorage - Prompt storage instance
   * @param {import("@copilot-ld/libprompt").PromptOptimizer} promptOptimizer - Prompt optimizer instance
   * @param {Function} [grpcFn] - Optional gRPC factory function
   * @param {Function} [authFn] - Optional auth factory function
   */
  constructor(config, promptStorage, promptOptimizer, grpcFn, authFn) {
    super(config, grpcFn, authFn);
    this.#promptStorage = promptStorage;
    this.#promptOptimizer = promptOptimizer;
  }

  /**
   * Retrieves chat history as a prompt for a session
   * @param {object} request - Request object containing session ID
   * @param {string} request.session_id - ID of the session to retrieve history for
   * @returns {Promise<object>} Response containing prompt object
   */
  async GetHistory({ session_id }) {
    const prompt = await this.#promptStorage.get(session_id);
    return { prompt };
  }

  /**
   * Updates chat history with a new prompt, applying async optimization
   * @param {object} request - Request object containing session data
   * @param {string} request.session_id - ID of the session to update
   * @param {Prompt} request.prompt - Prompt object to store
   * @param {string} request.github_token - GitHub token for LLM optimization
   * @returns {Promise<object>} Response indicating success status and optimization
   */
  async UpdateHistory({ session_id, prompt, github_token }) {
    try {
      // Optimize the prompt before storing (async processing)
      const optimizedPrompt = await this.#promptOptimizer.optimize(
        prompt,
        github_token,
      );
      await this.#promptStorage.store(session_id, optimizedPrompt);

      console.log(
        `[history] Updated session ${session_id} with optimized prompt`,
      );
      return { success: true, optimized: true };
    } catch (error) {
      console.error(
        "[history] Optimization failed, storing unoptimized:",
        error.message,
      );
      // Store unoptimized as fallback
      await this.#promptStorage.store(session_id, prompt);

      console.log(
        `[history] Updated session ${session_id} with unoptimized prompt`,
      );
      return { success: true, optimized: false };
    }
  }
}

export { HistoryService, HistoryServiceInterface };
