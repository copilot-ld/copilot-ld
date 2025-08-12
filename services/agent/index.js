/* eslint-env node */
import { Similarity } from "@copilot-ld/libtype";
import { PromptBuilder, PromptAssembler } from "@copilot-ld/libprompt";
import { Service } from "@copilot-ld/libservice";

import { AgentServiceInterface } from "./types.js";

/**
 * Main orchestration service for agent requests
 * @implements {AgentServiceInterface}
 */
class AgentService extends Service {
  #clients;
  #octokitFactory;

  /**
   * Creates a new Agent service instance
   * @param {object} config - Service configuration object
   * @param {object} clients - Service clients object
   * @param {Function} octokitFactory - Factory function to create Octokit instances
   * @param {Function} [grpcFn] - Optional gRPC factory function
   * @param {Function} [authFn] - Optional auth factory function
   */
  constructor(config, clients, octokitFactory, grpcFn, authFn) {
    super(config, grpcFn, authFn);
    this.#clients = clients;
    this.#octokitFactory = octokitFactory;
  }

  /**
   * Processes an agent request using simplified prompt management
   * @param {object} params - Request parameters
   * @param {Array} params.messages - Array of conversation messages
   * @param {string} params.session_id - Optional session ID for conversation continuity
   * @param {string} params.github_token - GitHub authentication token
   * @returns {Promise<object>} Completion response with session ID
   */
  async ProcessRequest({ messages: clientMessages, session_id, github_token }) {
    // Ensure all clients are ready before processing
    await Promise.all([
      this.#clients.history.ensureReady(),
      this.#clients.llm.ensureReady(),
      this.#clients.scope.ensureReady(),
      this.#clients.vector.ensureReady(),
      this.#clients.text.ensureReady(),
    ]);

    const octokit = this.#octokitFactory(github_token);
    await octokit.request("GET /user");

    const sessionId = session_id || PromptBuilder.generateSessionId();
    const latestUserMessage =
      PromptBuilder.getLatestUserMessage(clientMessages);

    // 1. Get existing prompt from history service
    const { prompt: existingPrompt } = await this.#clients.history.GetHistory({
      session_id: sessionId,
    });

    let requestPrompt;
    let currentSimilarities = [];

    if (latestUserMessage?.content) {
      // Get embeddings and search for similar content
      const embeddings = await this.#clients.llm.CreateEmbeddings({
        chunks: [latestUserMessage.content],
        github_token,
      });

      const vector = embeddings.data[0].embedding;
      const { indices } = await this.#clients.scope.ResolveScope({ vector });

      if (indices.length > 0) {
        const { results } = await this.#clients.vector.QueryItems({
          indices: indices,
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
            const similarity = new Similarity(r);
            similarity.text = chunk?.text;
            return similarity;
          });
        }
      }

      // 2. Build request prompt using PromptAssembler (fast, no optimization)
      requestPrompt = PromptAssembler.buildRequest(
        existingPrompt,
        latestUserMessage,
        currentSimilarities,
        this.config.prompts,
      );
    } else {
      console.log("NO NEW MESSAGE");
      // No new user message, use existing prompt
      requestPrompt = existingPrompt;
    }

    // 3. Get LLM completion
    const completions = await this.#clients.llm.CreateCompletions({
      prompt: requestPrompt,
      temperature: this.config.temperature,
      github_token,
    });

    // 4. Fire-and-forget history update (optimization happens internally)
    if (completions.choices?.length > 0) {
      const updatedPrompt = PromptAssembler.updateWithResponse(
        requestPrompt,
        completions.choices[0].message,
      );

      // Use fire-and-forget pattern for async history update
      this.#clients.history.fireAndForget.UpdateHistory({
        session_id: sessionId,
        prompt: updatedPrompt,
        github_token,
      });
    }

    return { ...completions, session_id: sessionId };
  }
}

export { AgentService, AgentServiceInterface };
