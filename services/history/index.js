/* eslint-env node */
import { common } from "@copilot-ld/libtype";

import { HistoryBase } from "./types.js";

/**
 * Chat history management service with prompt storage and optimization
 */
class HistoryService extends HistoryBase {
  #promptStorage;
  #promptOptimizer;

  /**
   * Creates a new History service instance
   * @param {object} config - Service configuration object
   * @param {import("@copilot-ld/libprompt").PromptStorage} promptStorage - Prompt storage instance
   * @param {import("@copilot-ld/libprompt").PromptOptimizer} promptOptimizer - Prompt optimizer instance
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, promptStorage, promptOptimizer, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    this.#promptStorage = promptStorage;
    this.#promptOptimizer = promptOptimizer;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").history.GetHistoryRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").history.GetHistoryResponse>} Response message
   */
  async GetHistory(req) {
    const prompt = await this.#promptStorage.get(req.session_id);

    // Ensure the prompt is properly typed
    const typedPrompt =
      prompt instanceof common.Prompt
        ? prompt
        : common.Prompt.fromObject(prompt || {});

    return { prompt: typedPrompt };
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").history.UpdateHistoryRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").history.UpdateHistoryResponse>} Response message
   */
  async UpdateHistory(req) {
    try {
      // Ensure the request prompt is properly typed before optimization
      const typedPrompt =
        req.prompt instanceof common.Prompt
          ? req.prompt
          : common.Prompt.fromObject(req.prompt);

      // Optimize the prompt before storing (async processing)
      const optimizedPrompt = await this.#promptOptimizer.optimize(
        typedPrompt,
        req.github_token,
      );
      await this.#promptStorage.store(req.session_id, optimizedPrompt);

      this.debug("Updated session", {
        session: req.session_id,
        optimized: true,
      });
      return { success: true, optimized: true };
    } catch (error) {
      console.error(
        "[history] Optimization failed, storing unoptimized:",
        error.message,
      );

      // Ensure fallback prompt is also properly typed before storing
      const typedPrompt =
        req.prompt instanceof common.Prompt
          ? req.prompt
          : common.Prompt.fromObject(req.prompt);

      // Store unoptimized as fallback
      await this.#promptStorage.store(req.session_id, typedPrompt);

      this.debug("Updated session", {
        session: req.session_id,
        optimized: false,
      });
      return { success: true, optimized: false };
    }
  }
}

export { HistoryService };
