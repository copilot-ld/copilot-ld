/* eslint-env node */
import { common } from "@copilot-ld/libtype";

/**
 * Base interface for LLMs
 */
export class LlmInterface {
  /**
   * Creates a new LLM instance
   * @param {string} token - LLM token
   * @param {string} model - Default model to use for completions
   * @param {(url: string, options?: object) => Promise<Response>} fetchFn - HTTP client function (defaults to fetch if not provided)
   * @param {() => object} tokenizerFn - Tokenizer instance for counting tokens
   * @throws {Error} Not implemented
   */
  constructor(token, model, fetchFn = null, tokenizerFn = null) {}

  /**
   * Counts tokens in the given text using the tokenizer
   * @param {string} text - The text to count tokens for
   * @throws {Error} Not implemented
   */
  countTokens(text) {
    throw new Error("Not implemented");
  }

  /**
   * Creates chat completions using the LLM API
   * @param {import("copilot-ld/libtype").MessageV2[]} messages - Array of message objects with roles and content
   * @param {import("copilot-ld/libtype").Tool[]} [tools] - Optional array of tool definitions
   * @param {number} [temperature] - Optional sampling temperature
   * @param {number} [max_tokens] - Optional maximum tokens to generate
   * @returns {Promise<object>} Completion response from Copilot
   * @throws {Error} Not implemented
   */
  async createCompletions(messages, tools, temperature, max_tokens) {
    throw new Error("Not implemented");
  }

  /**
   * Creates embeddings using the LLM API
   * @param {string[]} texts - Array of text strings to embed
   * @returns {Promise<common.Embedding[]>} Array of Embedding instances
   * @throws {Error} Not implemented
   */
  async createEmbeddings(texts) {
    throw new Error("Not implemented");
  }

  /**
   * Lists models available to the current user
   * @returns {Promise<object[]>} Array of available models
   * @throws {Error} Not implemented
   */
  async listModels() {
    throw new Error("Not implemented");
  }
}
