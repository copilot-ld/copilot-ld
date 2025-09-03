/* eslint-env node */
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

import { common } from "@copilot-ld/libtype";

import { LlmInterface } from "./types.js";

/**
 * @typedef {object} CompletionParams
 * @property {string} [model] - Model to use for completion (overrides default)
 * @property {common.Message[]} messages - Array of chat messages
 * @property {number} [max_tokens] - Maximum tokens to generate
 * @property {number} [temperature] - Sampling temperature
 * @property {number} [top_p] - Nucleus sampling parameter
 */

/**
 * GitHub Copilot API client with direct HTTP calls
 * @implements {LlmInterface}
 */
export class Copilot extends LlmInterface {
  #model;
  #baseURL;
  #headers;
  #retries;
  #delay;
  #fetch;
  #tokenizer;

  /** @inheritdoc */
  constructor(token, model, fetchFn = fetch, tokenizerFn = tokenizerFactory) {
    super(token, model, fetchFn, tokenizerFn);
    if (typeof fetchFn !== "function")
      throw new Error("Invalid fetch function");
    if (typeof tokenizerFn !== "function")
      throw new Error("Invalid tokenizer function");

    this.#model = model;
    this.#baseURL = "https://api.githubcopilot.com";
    this.#headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    this.#retries = 3;
    this.#delay = 1000;
    this.#fetch = fetchFn;
    this.#tokenizer = tokenizerFn();
  }

  /**
   * Set retry delay for testing purposes
   * @param {number} delay - Delay in milliseconds
   */
  _setTestDelay(delay) {
    this.#delay = delay;
  }

  /**
   * Throws an Error with HTTP status and a snippet of the response body when response is not OK
   * @param {Response} response - Fetch API response
   * @returns {Promise<void>}
   * @throws {Error} With enriched message including body snippet
   */
  async #throwIfNotOk(response) {
    if (response.ok) return;
    const body = await response.text().catch(() => "");
    const snippet = body ? ` - ${body.slice(0, 2000)}` : "";
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}${snippet}`,
    );
  }

  /**
   * Executes API request with exponential backoff retry logic for rate limiting
   * @param {() => Promise<Response>} requestFn - Function that returns a fetch promise
   * @returns {Promise<Response>} Response from successful request
   * @throws {Error} When all retry attempts are exhausted
   */
  async #withRetry(requestFn) {
    for (let attempt = 0; attempt <= this.#retries; attempt++) {
      const response = await requestFn();

      if (response.status === 429 && attempt < this.#retries) {
        const wait = this.#delay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }

      await this.#throwIfNotOk(response);
      return response;
    }
  }

  /** @inheritdoc */
  async createCompletions(params) {
    // Convert MessageV2 objects to simple API format
    const messages =
      params.messages?.map((msg) => ({
        role: msg.role || "user",
        content:
          typeof msg.content === "string"
            ? msg.content
            : msg.content?.text || JSON.stringify(msg.content) || "",
      })) || [];

    const requestParams = {
      ...params,
      messages,
      model: params.model || this.#model,
      max_tokens: params.max_tokens || 4000, // Add default max_tokens
    };

    const response = await this.#withRetry(() =>
      this.#fetch(`${this.#baseURL}/chat/completions`, {
        method: "POST",
        headers: this.#headers,
        body: JSON.stringify(requestParams),
      }),
    );

    const data = await response.json();

    // Convert response back to expected format with proper MessageV2 instances
    // The monkey patch in libtype automatically converts string content to Content objects
    return {
      ...data,
      choices:
        data.choices?.map((choice) => ({
          ...choice,
          message: common.MessageV2.fromObject({
            id: { name: "" }, // Will be set later with withIdentifier
            descriptor: { type: "message" },
            content: choice.message?.content || "", // Monkey patch handles string->Content conversion
            role: choice.message?.role || "assistant",
          }),
        })) || [],
    };
  }

  /** @inheritdoc */
  async createEmbeddings(texts) {
    const response = await this.#withRetry(() =>
      this.#fetch(`${this.#baseURL}/embeddings`, {
        method: "POST",
        headers: this.#headers,
        body: JSON.stringify({
          // TODO: Make this configurable
          model: "text-embedding-3-small",
          dimensions: 256,
          input: texts,
        }),
      }),
    );

    const data = await response.json();
    return data.data.map((item) => {
      const normalizedEmbedding = normalizeVector(item.embedding);
      return new common.Embedding({
        ...item,
        embedding: normalizedEmbedding,
      });
    });
  }

  /** @inheritdoc */
  async listModels() {
    const response = await this.#fetch(`${this.#baseURL}/models`, {
      method: "GET",
      headers: this.#headers,
    });

    await this.#throwIfNotOk(response);
    const responseData = await response.json();
    return responseData.data;
  }

  /** @inheritdoc */
  countTokens(text) {
    return countTokens(text, this.#tokenizer);
  }
}

/**
 * Helper function to count tokens
 * @param {string} text - Text to count tokens for
 * @param {Tiktoken} tokenizer - Tokenizer instance
 * @returns {number} Approximate token count
 */
export function countTokens(text, tokenizer) {
  if (!tokenizer) tokenizer = tokenizerFactory();
  return tokenizer.encode(text).length;
}

/**
 * Normalizes a vector to unit length
 * @param {number[]} vector - Vector to normalize
 * @returns {number[]} Normalized vector
 */
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector.slice(); // Return copy of zero vector
  return vector.map((val) => val / magnitude);
}

/**
 * Factory function to create a Copilot instance with default dependencies
 * @param {string} token - GitHub Copilot token
 * @param {string} [model] - Default model to use
 * @param {(url: string, options?: object) => Promise<Response>} [fetchFn] - HTTP client function
 * @param {() => object} [tokenizerFn] - Tokenizer factory function
 * @returns {Copilot} Configured Copilot instance
 */
export function llmFactory(
  token,
  model = "gpt-4o",
  fetchFn = fetch,
  tokenizerFn = tokenizerFactory,
) {
  return new Copilot(token, model, fetchFn, tokenizerFn);
}

/**
 * Creates a new tokenizer instance
 * @returns {Tiktoken} New tokenizer instance
 */
export function tokenizerFactory() {
  return new Tiktoken(o200k_base);
}

export { LlmInterface };
