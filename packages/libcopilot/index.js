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
  constructor(token, model, fetchFn = fetch, tokenizer = null) {
    super(token, model, fetchFn, tokenizer);
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
    this.#tokenizer = tokenizer || new Tiktoken(o200k_base);
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

    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

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

      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

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

    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

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
 * @param {object} [tokenizer] - Tokenizer instance
 * @returns {Copilot} Configured Copilot instance
 */
export function llmFactory(
  token,
  model = "gpt-4o",
  fetchFn = fetch,
  tokenizer = null,
) {
  const defaultTokenizer = tokenizer || new Tiktoken(o200k_base);
  return new Copilot(token, model, fetchFn, defaultTokenizer);
}

export { LlmInterface };
