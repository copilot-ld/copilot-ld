/* eslint-env node */
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

import * as libtype from "@copilot-ld/libtype";

import { LlmInterface } from "./types.js";

/** TODO 0 */
/** TODO 1 */
/** TODO 2 */
/** TODO 3 */

/**
 * @typedef {object} CompletionParams
 * @property {string} [model] - Model to use for completion (overrides default)
 * @property {libtype.Message[]} messages - Array of chat messages
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

  /** @inheritdoc */
  async createCompletions(params) {
    const requestParams = {
      ...params,
      model: params.model || this.#model,
    };

    const response = await this.#fetch(`${this.#baseURL}/chat/completions`, {
      method: "POST",
      headers: this.#headers,
      body: JSON.stringify(requestParams),
    });

    await this.#throwIfNotOk(response);
    return await response.json();
  }

  /** @inheritdoc */
  async createEmbeddings(texts) {
    for (let attempt = 0; attempt <= this.#retries; attempt++) {
      const response = await this.#fetch(`${this.#baseURL}/embeddings`, {
        method: "POST",
        headers: this.#headers,
        body: JSON.stringify({
          // TODO: Make this configurable
          model: "text-embedding-3-small",
          dimensions: 256,
          input: texts,
        }),
      });

      if (response.status === 429 && attempt < this.#retries) {
        const wait = this.#delay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }

      await this.#throwIfNotOk(response);
      const data = await response.json();
      return data.data.map((item) => new libtype.Embedding(item));
    }
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
    const tokens = this.#tokenizer.encode(text);
    return tokens.length;
  }
}

/**
 * Factory function to create a Copilot instance with default dependencies
 * @param {string} token - GitHub Copilot token
 * @param {string} [model] - Default model to use
 * @param {Function} [fetchFn] - HTTP client function
 * @param {Function} [tokenizerFn] - Tokenizer factory function
 * @returns {Copilot} Configured Copilot instance
 */
export function llmFactory(
  token,
  model = "gpt-4o",
  fetchFn = fetch,
  tokenizerFn = null,
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
