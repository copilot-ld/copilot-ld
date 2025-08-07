/* eslint-env node */
import crypto from "crypto";

import * as libtype from "@copilot-ld/libtype";

/**
 * Object-oriented prompt builder for AI agents with proper prompt ordering
 */
export class PromptBuilder {
  /**
   * Creates a new PromptBuilder instance
   */
  constructor() {
    this.systemPrompts = [];
    this.contextPrompt = null;
    this.userMessages = [];
  }

  /**
   * Adds one or more system prompts
   * @param {...string} prompts - System prompt content strings
   * @returns {PromptBuilder} This instance for method chaining
   */
  system(...prompts) {
    prompts.forEach((prompt) => {
      this.systemPrompts.push(
        new libtype.Message({ role: "system", content: prompt }),
      );
    });
    return this;
  }

  /**
   * Adds context from similarity search results
   * @param {libtype.Similarity[]} similarities - Array of similarity search results with text property
   * @returns {PromptBuilder} This instance for method chaining
   */
  context(similarities) {
    if (similarities.length === 0) {
      return this;
    }

    const contextContent = `Here related context that might help answer the user's question:
${similarities.map((result) => result.text.trim()).join("\n\n")}`;

    this.contextPrompt = new libtype.Message({
      role: "system",
      content: contextContent,
    });
    return this;
  }

  /**
   * Sets the user/conversation messages
   * @param {object[]} messages - Array of conversation message objects
   * @returns {PromptBuilder} This instance for method chaining
   */
  messages(messages) {
    this.userMessages = messages.map((msg) => new libtype.Message(msg));
    return this;
  }

  /**
   * Builds and returns properly ordered messages for AI agents
   * Order: system prompts → context prompt → user/conversation messages
   * @returns {libtype.Message[]} Array of properly ordered Message objects
   */
  build() {
    const orderedMessages = [];

    // 1. System prompts first
    orderedMessages.push(...this.systemPrompts);

    // 2. Context prompt second
    if (this.contextPrompt) {
      orderedMessages.push(this.contextPrompt);
    }

    // 3. User/conversation messages last
    orderedMessages.push(...this.userMessages);

    return orderedMessages;
  }

  /**
   * Generates a unique session ID using crypto.randomUUID
   * @returns {string} Unique session identifier
   */
  static generateSessionId() {
    return crypto.randomUUID();
  }

  /**
   * Extracts the latest user message from a messages array
   * @param {object[]} messages - Array of message objects with role property
   * @returns {object|null} Latest user message or null if none found
   */
  static getLatestUserMessage(messages) {
    const userMessages = messages.filter((msg) => msg.role === "user");
    return userMessages[userMessages.length - 1] || null;
  }
}
