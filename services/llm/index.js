/* eslint-env node */
import { common, llm } from "@copilot-ld/libtype";

import { LlmBase } from "../../generated/services/llm/service.js";

/**
 * LLM service for completions and embeddings
 */
export class LlmService extends LlmBase {
  #llmFactory;

  /**
   * Creates a new LLM service instance
   * @param {object} config - Service configuration object
   * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - Factory function to create LLM instances
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, llmFactory, logFn) {
    super(config, logFn);
    this.#llmFactory = llmFactory;
  }

  /** @inheritdoc */
  async CreateCompletions(req) {
    const copilot = this.#llmFactory(req.github_token, this.config.model);

    // Convert MessageV2 objects to simple message format for the LLM
    // TODO: This is not where fallbacks should be handled
    // TODO: We need better and more flexible rendering of representations
    const pendingToolCallIds = [];
    const messages = req.messages.map((m, idx) => {
      const content = m.content ? String(m.content) : String(m.descriptor);
      const out = { role: m.role || "system", content };
      // Queue tool call ids from assistant messages
      if (
        m.role === "assistant" &&
        Array.isArray(m.tool_calls) &&
        m.tool_calls.length > 0
      ) {
        for (const tc of m.tool_calls) pendingToolCallIds.push(tc.id);
        out.tool_calls = m.tool_calls.map((tc) => ({
          id: tc.id,
          type: tc.type || "function",
          function: {
            name:
              (tc.function?.id?.name && tc.function.id.name.split(".").pop()) ||
              tc.function?.name ||
              "unknown",
            arguments: tc.function?.arguments,
          },
        }));
      }
      if (m.role === "tool") {
        // Reconstruct tool_call_id if missing by consuming from queue
        const explicit = m.tool_call_id || m.toolCallId;
        const reconstructed = explicit || pendingToolCallIds.shift();
        out.tool_call_id = reconstructed || `auto_tool_call_${idx}`;
      }
      return out;
    });

    // TODO: Again, we need more flexible rendering of representations
    const tools = req.tools?.map((t) => {
      const rawIdName = t.function.id?.name || "";
      const simpleName = rawIdName.includes(".")
        ? rawIdName.split(".").pop()
        : rawIdName;
      const tool = {
        type: t.type,
        function: {
          name: simpleName || t.function.name || "unknown",
          description:
            t.function.descriptor?.purpose ||
            String(t.function.descriptor) ||
            "",
          parameters: t.function.parameters || {},
        },
      };

      return tool;
    });

    this.debug("Creating completion", {
      messages: messages.length,
      tools: tools?.length || 0,
      temperature: req.temperature,
      model: this.config.model,
    });

    const completion = await copilot.createCompletions({
      messages,
      tools,
      temperature: req.temperature,
    });

    return llm.CompletionsResponse.fromObject(completion);
  }

  /** @inheritdoc */
  async CreateEmbeddings(req) {
    this.debug("Creating embeddings", {
      chunks: req.chunks?.length || 0,
    });

    const client = this.#llmFactory(req.github_token, this.config.model);
    const data = await client.createEmbeddings(req.chunks);

    // Ensure embedding data uses proper typed constructors
    return {
      data: data.map((embedding) =>
        embedding instanceof common.Embedding
          ? embedding
          : new common.Embedding(embedding),
      ),
    };
  }
}

// Export the service class (no bootstrap code here)
export { LlmClient } from "../../generated/services/llm/client.js";
