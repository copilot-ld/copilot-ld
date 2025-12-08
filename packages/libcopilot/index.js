/* eslint-env node */
import { readFile } from "node:fs/promises";
import { common, llm } from "@copilot-ld/libtype";
import { countTokens, createTokenizer, createRetry } from "@copilot-ld/libutil";
import { ProxyAgent } from "undici";

// Note: getBudget has moved to @copilot-ld/libmemory as getModelBudget
// This re-export is deprecated and will be removed in a future version
export { getBudget } from "./models.js";

/**
 * GitHub Copilot API client with direct HTTP calls
 */
export class Copilot {
  #model;
  #baseURL;
  #headers;
  #fetch;
  #tokenizer;
  #retry;

  /**
   * Creates a new LLM instance
   * @param {string} token - LLM token
   * @param {string} model - Default model to use for completions
   * @param {import("@copilot-ld/libutil").Retry} retry - Retry instance for handling transient errors
   * @param {(url: string, options?: object) => Promise<Response>} fetchFn - HTTP client function (defaults to fetch if not provided)
   * @param {() => object} tokenizerFn - Tokenizer instance for counting tokens
   */
  constructor(
    token,
    model,
    retry,
    fetchFn = fetch,
    tokenizerFn = createTokenizer,
  ) {
    if (!retry) throw new Error("retry is required");
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
    this.#fetch = fetchFn;
    this.#tokenizer = tokenizerFn();
    this.#retry = retry;
  }

  /**
   * Throws an Error with HTTP status and a snippet of the response body when response is not OK
   * @param {Response} response - Fetch API response
   * @returns {Promise<void>}
   * @throws {Error} With enriched message including body snippet
   */
  async #throwIfNotOk(response) {
    if (response.ok) return;
    let errorDetails = "";
    try {
      const text = await response.text();
      errorDetails = text ? `: ${text.substring(0, 200)}` : "";
    } catch {
      // Ignore error reading body
    }
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}${errorDetails}`,
    );
  }

  /**
   * Creates chat completions using the LLM API
   * @param {import("copilot-ld/libtype").memory.Window[]} window - Memory window
   * @returns {Promise<import("copilot-ld/libtype").llm.CompletionsResponse>} Completion response from Copilot
   */
  async createCompletions(window) {
    const body = {
      ...window,
      model: this.#model,
    };

    const response = await this.#retry.execute(() =>
      this.#fetch(`${this.#baseURL}/chat/completions`, {
        method: "POST",
        headers: this.#headers,
        body: JSON.stringify(body),
      }),
    );

    await this.#throwIfNotOk(response);

    const json = await response.json();
    return llm.CompletionsResponse.fromObject(json);
  }

  /**
   * Creates embeddings using the LLM API
   * @param {string[]} input - Array of text strings to embed
   * @returns {Promise<import("copilot-ld/libtype").common.Embeddings>} Embeddings response
   */
  async createEmbeddings(input) {
    const response = await this.#retry.execute(() =>
      this.#fetch(`${this.#baseURL}/embeddings`, {
        method: "POST",
        headers: this.#headers,
        body: JSON.stringify({
          // TODO: Make this configurable
          model: "text-embedding-3-small",
          dimensions: 256,
          input,
        }),
      }),
    );

    await this.#throwIfNotOk(response);

    const json = await response.json();
    return common.Embeddings.fromObject(json);
  }

  /**
   * Lists models available to the current user
   * @returns {Promise<object[]>} Array of available models
   */
  async listModels() {
    const response = await this.#fetch(`${this.#baseURL}/models`, {
      method: "GET",
      headers: this.#headers,
    });

    await this.#throwIfNotOk(response);
    const json = await response.json();
    return json.data;
  }

  /**
   * Counts tokens in the given text using the tokenizer
   * @param {string} text - The text to count tokens for
   * @returns {number} Number of tokens in the text
   */
  countTokens(text) {
    return countTokens(text, this.#tokenizer);
  }

  /**
   * Converts an image to text description using vision capabilities
   * @param {string|Buffer} file - Path to the image file or a Buffer containing the image data
   * @param {string} [prompt] - Optional text prompt to guide the description
   * @param {string} [model] - Model to use for image-to-text conversion, defaults to instance model
   * @param {string} [systemPrompt] - System prompt to set context for the description
   * @param {number} [max_tokens] - Maximum tokens to generate in the description
   * @param {string} [mimeType] - The mime type of the file. Defaults to image/png if file is a buffer, otherwise determined from the extension
   * @returns {Promise<string>} Text description of the image
   */
  async imageToText(
    file,
    prompt = "Describe this image in detail.",
    model = this.#model,
    systemPrompt = "You are an AI assistant that describes images accurately and in detail.",
    max_tokens = 1000,
    mimeType = "image/png",
  ) {
    let buffer;
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else {
      buffer = await readFile(file);
      const extension = file.split(".").pop().toLowerCase();
      mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;
    }

    const base64 = buffer.toString("base64");

    const body = {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens,
    };

    const response = await this.#retry.execute(() =>
      this.#fetch(`${this.#baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          ...this.#headers,
          "Copilot-Vision-Request": "true",
        },
        body: JSON.stringify(body),
      }),
    );

    await this.#throwIfNotOk(response);

    const json = await response.json();
    return json.choices[0]?.message?.content || "";
  }
}

/**
 * Creates a proxy-aware fetch function that respects HTTPS_PROXY environment variable
 * @param {object} [process] - Process object for environment variable access
 * @returns {(url: string, options?: object) => Promise<Response>} Fetch function with proxy support
 */
export function createProxyAwareFetch(process = global.process) {
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;

  if (!httpsProxy) {
    return fetch;
  }

  const agent = new ProxyAgent(httpsProxy);

  return (url, options = {}) => {
    return fetch(url, {
      ...options,
      dispatcher: agent,
    });
  };
}

/**
 * Factory function to create a Copilot instance with default dependencies
 * @param {string} token - GitHub Copilot token
 * @param {string} [model] - Default model to use
 * @param {(url: string, options?: object) => Promise<Response>} [fetchFn] - HTTP client function
 * @param {() => object} [tokenizerFn] - Tokenizer factory function
 * @returns {Copilot} Configured Copilot instance
 */
export function createLlm(
  token,
  model = "gpt-4o",
  fetchFn = createProxyAwareFetch(),
  tokenizerFn = createTokenizer,
) {
  const retry = createRetry();
  return new Copilot(token, model, retry, fetchFn, tokenizerFn);
}

/**
 * Normalizes a vector to unit length
 * @param {number[]} vector - Vector to normalize
 * @returns {number[]} Normalized vector
 */
export function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector.slice(); // Return copy of zero vector
  return vector.map((val) => val / magnitude);
}
