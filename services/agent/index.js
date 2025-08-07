/* eslint-env node */
import { Similarity } from "@copilot-ld/libtype";
import { PromptBuilder } from "@copilot-ld/libprompt";
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
   */
  constructor(config, clients, octokitFactory) {
    super(config);
    this.#clients = clients;
    this.#octokitFactory = octokitFactory;
  }

  /**
   * Processes an agent request by coordinating multiple services to generate
   * context-aware responses using RAG (Retrieval Augmented Generation)
   * @param {object} params - Request parameters
   * @param {Array} params.messages - Array of conversation messages
   * @param {string} params.session_id - Optional session ID for conversation continuity
   * @param {string} params.github_token - GitHub authentication token
   * @returns {Promise<object>} Completion response with session ID
   */
  async ProcessRequest({ messages: clientMessages, session_id, github_token }) {
    const octokit = this.#octokitFactory(github_token);
    await octokit.request("GET /user");

    const sessionId = session_id || PromptBuilder.generateSessionId();
    const latestUserMessage =
      PromptBuilder.getLatestUserMessage(clientMessages);

    let context = [];
    let messages;

    if (latestUserMessage?.content) {
      const [historyMessages, embeddings] = await Promise.all([
        this.#clients.history.GetHistory({ session_id: sessionId }),
        this.#clients.llm.CreateEmbeddings({
          chunks: [latestUserMessage.content],
          github_token,
        }),
      ]);

      messages = [...historyMessages.messages, latestUserMessage];
      const vector = embeddings.data[0].embedding;

      const { indices } = await this.#clients.scope.ResolveScope({ vector });

      if (indices.length > 0) {
        const { results } = await this.#clients.vector.QueryItems({
          indices: indices,
          vector,
          threshold: this.config.threshold,
          limit: this.config.limit,
        });

        if (results.length > 0) {
          const { chunks } = await this.#clients.text.GetChunks({
            ids: results.map((r) => r.id),
          });

          context = results.map((r) => {
            const chunk = chunks[r.id];
            const similarity = new Similarity(r);
            similarity.text = chunk?.text;
            return similarity;
          });
        }
      }
    } else {
      const { messages: history } = await this.#clients.history.GetHistory({
        session_id: sessionId,
      });
      messages = history;
    }

    const enhancedMessages = new PromptBuilder()
      .messages(messages)
      .context(context)
      .system(...this.config.prompts)
      .build();

    const completions = await this.#clients.llm.CreateCompletions({
      messages: enhancedMessages,
      temperature: this.config.temperature,
      github_token,
    });

    if (completions.choices?.length > 0) {
      const updatedMessages = [...messages, completions.choices[0].message];
      this.#clients.history.fireAndForget.UpdateHistory({
        session_id: sessionId,
        messages: updatedMessages,
      });
    }

    return { ...completions, session_id: sessionId };
  }
}

export { AgentService, AgentServiceInterface };
