/* eslint-env node */
import NodeCache from "node-cache";

import { Service } from "@copilot-ld/libservice";

import { HistoryServiceInterface } from "./types.js";

/**
 * Chat history management service with caching and token management
 * @implements {HistoryServiceInterface}
 */
class HistoryService extends Service {
  #cache;
  #llmFactory;

  /**
   * Creates a new History service instance
   * @param {object} config - Service configuration object
   * @param {NodeCache} cache - Cache instance for storing messages
   * @param {Function} llmFactory - Factory function to create LLM instances
   * @param {Function} [grpcFn] - Optional gRPC factory function
   * @param {Function} [authFn] - Optional auth factory function
   */
  constructor(config, cache, llmFactory, grpcFn, authFn) {
    super(config, grpcFn, authFn);
    this.#cache = cache;
    this.#llmFactory = llmFactory;
  }

  /**
   * Retrieves chat history for a session with token limit enforcement
   * @param {object} request - Request object containing session ID
   * @param {string} request.session_id - ID of the session to retrieve history for
   * @param {number} [request.max_tokens] - Maximum tokens to return in history
   * @returns {Promise<object>} Response containing session messages
   */
  async GetHistory({ session_id, max_tokens }) {
    const historyData = this.#cache.get(session_id);
    let messages = historyData?.messages || [];

    // If no token limit, return all messages
    if (max_tokens === undefined || max_tokens === null) {
      return { messages };
    }

    // Filter messages to respect token limit, starting from most recent
    const filteredMessages = [];
    let totalTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = historyData?.tokenCounts?.[i];

      if (messageTokens === undefined || messageTokens === null) {
        throw new Error(`Token count missing for message at index ${i}.`);
      }

      if (totalTokens + messageTokens <= max_tokens) {
        filteredMessages.unshift(message);
        totalTokens += messageTokens;
      } else {
        break;
      }
    }

    console.log(
      `[history] Retrieved ${filteredMessages.length}/${messages.length} messages within ${totalTokens}/${max_tokens} tokens`,
    );
    return { messages: filteredMessages };
  }

  /**
   * Updates chat history for a session with token limit management
   * @param {object} request - Request object containing session data
   * @param {string} request.session_id - ID of the session to update
   * @param {object[]} request.messages - Array of messages to store
   * @param {string} [request.github_token] - GitHub token for LLM summarization
   * @returns {Promise<object>} Response indicating success status
   */
  async UpdateHistory({ session_id, messages, github_token }) {
    // Create LLM instance once for token counting and summarization
    const llm = this.#llmFactory(github_token, this.config.model || "gpt-4o");

    // Count tokens for all messages
    const tokenCounts = messages.map((message) =>
      this.#countMessageTokens(message, llm),
    );
    const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0);

    // Check if we need to summarize based on history token limit
    // Use a reasonable default if not configured
    const historyTokenLimit = this.config.historyTokens || 4000;

    let finalMessages = messages;
    let finalTokenCounts = tokenCounts;

    if (totalTokens > historyTokenLimit) {
      console.log(
        `[history] Token limit exceeded (${totalTokens}/${historyTokenLimit}), summarizing history`,
      );
      const result = await this.#summarizeHistory(
        messages,
        tokenCounts,
        historyTokenLimit,
        llm,
      );
      finalMessages = result.messages;
      finalTokenCounts = result.tokenCounts;
    }

    const success = this.#cache.set(session_id, {
      messages: finalMessages,
      tokenCounts: finalTokenCounts,
      totalTokens: finalTokenCounts.reduce((sum, count) => sum + count, 0),
      lastUpdated: Date.now(),
    });

    console.log(
      `[history] Updated session ${session_id} with ${finalMessages.length} messages (${finalTokenCounts.reduce((sum, count) => sum + count, 0)} tokens)`,
    );
    return { success };
  }

  /**
   * Counts tokens for a message
   * @param {object} message - Message object with role and content
   * @param {object} llm - LLM instance for token counting
   * @returns {number} Token count
   * @private
   */
  #countMessageTokens(message, llm) {
    if (!message || !message.content) return 0;
    // Include role in token count as it's part of the prompt
    const fullMessage = `${message.role}: ${message.content}`;

    return llm.countTokens(fullMessage);
  }

  /**
   * Summarizes old history entries when approaching token limits
   * @param {object[]} messages - Array of messages
   * @param {number[]} tokenCounts - Array of token counts for each message
   * @param {number} maxTokens - Maximum tokens allowed
   * @param {object} llm - LLM instance for token counting and summarization
   * @returns {Promise<object>} Object with summarized messages and token counts
   * @private
   */
  async #summarizeHistory(messages, tokenCounts, maxTokens, llm) {
    // Keep the most recent messages that fit within 60% of the limit
    const targetTokens = Math.floor(maxTokens * 0.6);
    const summaryTokenBudget = Math.floor(maxTokens * 0.3); // 30% for summary

    let keptMessages = [];
    let keptTokenCounts = [];
    let keptTokens = 0;

    // Start from the end (most recent) and work backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      if (keptTokens + tokenCounts[i] <= targetTokens) {
        keptMessages.unshift(messages[i]);
        keptTokenCounts.unshift(tokenCounts[i]);
        keptTokens += tokenCounts[i];
      } else {
        break;
      }
    }

    // If we have older messages to summarize
    if (keptMessages.length < messages.length) {
      const oldMessages = messages.slice(
        0,
        messages.length - keptMessages.length,
      );

      if (oldMessages.length > 0) {
        const summary = await this.#createSummary(
          oldMessages,
          summaryTokenBudget,
          llm,
        );

        // Add summary as a system message at the beginning
        const summaryMessage = {
          role: "system",
          content: `Previous conversation summary: ${summary}`,
        };
        const summaryTokens = this.#countMessageTokens(summaryMessage, llm);

        keptMessages.unshift(summaryMessage);
        keptTokenCounts.unshift(summaryTokens);
      }
    }

    return {
      messages: keptMessages,
      tokenCounts: keptTokenCounts,
    };
  }

  /**
   * Creates a summary of conversation messages using LLM
   * @param {object[]} messages - Messages to summarize
   * @param {number} maxTokens - Maximum tokens for summary
   * @param {object} llm - LLM instance for summarization
   * @returns {Promise<string>} Summary text
   * @private
   */
  async #createSummary(messages, maxTokens, llm) {
    if (!llm || !this.#llmFactory) {
      // Fallback to simple summary if no LLM access
      const userMessages = messages.filter((m) => m.role === "user");
      const assistantMessages = messages.filter((m) => m.role === "assistant");
      return `${userMessages.length} Q, ${assistantMessages.length} A discussed.`;
    }

    try {
      // Create a focused system prompt for summarization
      const systemPrompt = `You are a conversation summarizer. Your task is to create a concise, well-structured summary of a conversation history that preserves the key information and context for an AI assistant.

IMPORTANT GUIDELINES:
- Create a summary that captures the main topics, questions, and outcomes discussed
- Preserve technical details, code examples, and specific solutions mentioned
- Maintain the context and flow of the conversation
- Focus on information that would be useful for continuing the conversation
- Keep the summary under ${maxTokens} tokens
- Use clear, structured language with bullet points or short paragraphs
- Avoid redundancy and filler words

Format your summary as:
**Topics Discussed:**
- [Key topic 1 with brief context]
- [Key topic 2 with brief context]

**Key Solutions/Outcomes:**
- [Important solutions or decisions made]
- [Code examples or technical details if relevant]

**Context for Continuation:**
- [Any ongoing issues or next steps mentioned]`;

      // Prepare the conversation for summarization
      const conversationText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n\n");

      const summaryMessages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please summarize the following conversation:\n\n${conversationText}`,
        },
      ];

      const completion = await llm.createCompletions({
        messages: summaryMessages,
        max_tokens: Math.min(maxTokens, 500), // Cap at reasonable size
        temperature: 0.3, // Lower temperature for consistent summaries
      });

      if (completion.choices?.length > 0) {
        const summary = completion.choices[0].message.content.trim();

        // Validate the summary length
        const summaryTokens = llm.countTokens(summary);
        if (summaryTokens <= maxTokens) {
          return summary;
        }

        // If too long, truncate to fit
        const words = summary.split(" ");
        let truncated = "";
        for (const word of words) {
          const testSummary = truncated ? `${truncated} ${word}` : word;
          if (llm.countTokens(testSummary) <= maxTokens) {
            truncated = testSummary;
          } else {
            break;
          }
        }
        return truncated || summary.substring(0, maxTokens * 3); // Rough character estimate
      }
    } catch (error) {
      console.error("[history] Failed to create LLM summary:", error.message);
    }

    // Fallback to simple summary if LLM fails
    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    return `Previous conversation with ${userMessages.length} questions and ${assistantMessages.length} responses.`;
  }
}

export { HistoryService, HistoryServiceInterface };
