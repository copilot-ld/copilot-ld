/* eslint-env node */
import { common } from "@copilot-ld/libtype";
import {
  PromptAssembler,
  generateSessionId,
  getLatestUserMessage,
} from "@copilot-ld/libprompt";

import { AgentBase } from "./types.js";

/**
 * Main orchestration service for agent requests
 */
class AgentService extends AgentBase {
  #clients;
  #octokitFactory;

  /**
   * Creates a new Agent service instance
   * @param {object} config - Service configuration object
   * @param {object} clients - Service clients object
   * @param {(token: string) => object} octokitFactory - Factory function to create Octokit instances
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, clients, octokitFactory, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    this.#clients = clients;
    this.#octokitFactory = octokitFactory;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").agent.ProcessRequestRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").agent.ProcessRequestResponse>} Response message
   */
  async ProcessRequest(req) {
    this.debug("Processing request", {
      session: req.session_id,
      messages: req.messages?.length || 0,
    });

    // Ensure all clients are ready before processing
    await Promise.all([
      this.#clients.history.ensureReady(),
      this.#clients.llm.ensureReady(),
      this.#clients.vector.ensureReady(),
      this.#clients.text.ensureReady(),
    ]);

    const octokit = this.#octokitFactory(req.github_token);
    await octokit.request("GET /user");

    const finalSessionId = req.session_id || generateSessionId();

    // Use typed Message objects from the request - they're already properly typed
    const latestUserMessage = getLatestUserMessage(req.messages);

    // 1. Get existing prompt from history service
    const { prompt: existingPrompt } = await this.#clients.history.GetHistory({
      session_id: finalSessionId,
    });

    let requestPrompt;
    let currentSimilarities = [];

    if (latestUserMessage?.content) {
      // Get embeddings and search for similar content directly
      const embeddings = await this.#clients.llm.CreateEmbeddings({
        chunks: [latestUserMessage.content],
        github_token: req.github_token,
      });

      const vector = embeddings.data[0].embedding;

      const { results } = await this.#clients.vector.QueryItems({
        vector,
        threshold: this.config.threshold,
        limit: this.config.limit,
        max_tokens: this.config.similaritySearchTokens,
      });

      if (results?.length > 0) {
        const { chunks } = await this.#clients.text.GetChunks({
          ids: results.map((r) => r.id),
        });

        currentSimilarities = results.map((r) => {
          const chunk = chunks[r.id];
          // Create properly typed Similarity objects using the constructor
          return new common.Similarity({
            id: r.id,
            score: r.score,
            tokens: r.tokens,
            text: chunk?.text || "",
          });
        });
      }

      // 2. Build request prompt using PromptAssembler (fast, no optimization)
      requestPrompt = PromptAssembler.buildRequest(
        existingPrompt,
        latestUserMessage,
        currentSimilarities,
        this.config.prompts,
      );
    } else {
      this.debug("Processing without new message", { session: finalSessionId });
      // No new user message, use existing prompt
      requestPrompt = existingPrompt;
    }

    // 3. Get LLM completion
    const completions = await this.#clients.llm.CreateCompletions({
      prompt: requestPrompt,
      temperature: this.config.temperature,
      github_token: req.github_token,
    });

    // 4. Fire-and-forget history update (optimization happens internally)
    if (completions.choices?.length > 0) {
      // Ensure we work with properly typed Choice and Message objects
      const responseMessage =
        completions.choices[0].message instanceof common.Message
          ? completions.choices[0].message
          : common.Message.fromObject(completions.choices[0].message);

      const updatedPrompt = PromptAssembler.updateWithResponse(
        requestPrompt,
        responseMessage,
      );

      // Use fire-and-forget pattern for async history update
      this.#clients.history.fireAndForget.UpdateHistory({
        session_id: finalSessionId,
        prompt: updatedPrompt,
        github_token: req.github_token,
      });
    }

    this.debug("Request complete", {
      session: finalSessionId,
      choices: completions.choices?.length || 0,
      usage: completions.usage
        ? `${completions.usage.total_tokens} tokens`
        : "unknown",
    });

    // Return properly constructed AgentResponse with typed objects
    return {
      ...completions,
      session_id: finalSessionId,
    };
  }
}

export { AgentService };
