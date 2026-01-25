import { readFile } from "node:fs/promises";
import { common, llm } from "@copilot-ld/libtype";
import {
  countTokens,
  createTokenizer,
  createRetry,
  truncateToTokens,
} from "@copilot-ld/libutil";
import { ProxyAgent } from "undici";

/** @type {number} Max tokens for TEI embedding endpoint (bge-large-en-v1.5) */
const TEI_MAX_TOKENS = 512;

// Note: getBudget has moved to @copilot-ld/libmemory as getModelBudget
// This re-export is deprecated and will be removed in a future version
export { getBudget } from "./models.js";

/**
 * Default base URL for GitHub Models API
 * @type {string}
 */
export const DEFAULT_BASE_URL = "https://models.github.ai/inference";

/**
 * Normalizes the base URL to include /inference for GitHub Models
 * @param {string} baseUrl - Base URL for the LLM API
 * @returns {string} Normalized base URL
 */
function normalizeBaseUrl(baseUrl) {
  // For GitHub Models, ensure /inference is appended if not present
  if (baseUrl.includes("models.github.ai") && !baseUrl.includes("/inference")) {
    return `${baseUrl.replace(/\/$/, "")}/inference`;
  }
  return baseUrl;
}

/**
 * LLM API client with direct HTTP calls to OpenAI-compatible endpoints
 */
export class LlmApi {
  #model;
  #baseURL;
  #embeddingBaseURL;
  #headers;
  #fetch;
  #tokenizer;
  #retry;
  #temperature;

  /**
   * Creates a new LLM API instance
   * @param {string} token - LLM API token
   * @param {string} model - Default model to use for completions
   * @param {string} baseUrl - Base URL for the LLM API
   * @param {string} embeddingBaseUrl - Base URL for TEI embeddings (required)
   * @param {import("@copilot-ld/libutil").Retry} retry - Retry instance for handling transient errors
   * @param {(url: string, options?: object) => Promise<Response>} fetchFn - HTTP client function (defaults to fetch if not provided)
   * @param {() => object} tokenizerFn - Tokenizer instance for counting tokens
   * @param {number} [temperature] - Temperature for completions
   */
  constructor(
    token,
    model,
    baseUrl,
    embeddingBaseUrl,
    retry,
    fetchFn = fetch,
    tokenizerFn = createTokenizer,
    temperature = 0.3,
  ) {
    if (!baseUrl) throw new Error("baseUrl is required");
    if (!embeddingBaseUrl) throw new Error("embeddingBaseUrl is required");
    if (!retry) throw new Error("retry is required");
    if (typeof fetchFn !== "function")
      throw new Error("Invalid fetch function");
    if (typeof tokenizerFn !== "function")
      throw new Error("Invalid tokenizer function");

    this.#model = model;
    this.#baseURL = normalizeBaseUrl(baseUrl);
    this.#embeddingBaseURL = embeddingBaseUrl;
    this.#headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    this.#fetch = fetchFn;
    this.#tokenizer = tokenizerFn();
    this.#retry = retry;
    this.#temperature = temperature;
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
      temperature: this.#temperature,
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
   * Creates embeddings using TEI (Text Embeddings Inference)
   * @param {string[]} input - Array of text strings to embed
   * @returns {Promise<import("copilot-ld/libtype").common.Embeddings>} Embeddings response
   */
  async createEmbeddings(input) {
    // Truncate inputs to fit within TEI's token limit
    const processedInput = input.map((text) =>
      truncateToTokens(text, TEI_MAX_TOKENS),
    );

    const response = await this.#retry.execute(() =>
      this.#fetch(`${this.#embeddingBaseURL}/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: processedInput }),
      }),
    );

    await this.#throwIfNotOk(response);
    const json = await response.json();

    // TEI returns [[0.1, 0.2, ...]]
    return common.Embeddings.fromObject({
      object: "list",
      data: json.map((embedding, index) => ({
        object: "embedding",
        index,
        embedding,
      })),
      model: "bge-large-en-v1.5",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }

  /**
   * Lists models available to the current user
   * @returns {Promise<object[]>} Array of available models
   */
  async listModels() {
    // GitHub Models uses /catalog/models endpoint (not under /inference)
    const catalogUrl = this.#baseURL.replace("/inference", "/catalog/models");
    const response = await this.#fetch(catalogUrl, {
      method: "GET",
      headers: this.#headers,
    });

    await this.#throwIfNotOk(response);
    const json = await response.json();
    return json;
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
        headers: this.#headers,
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
 * Factory function to create an LlmApi instance with default dependencies
 * @param {string} token - LLM API token
 * @param {string} model - Model to use
 * @param {string} baseUrl - Base URL for the LLM API (required, e.g. https://models.github.ai/orgs/{org})
 * @param {string} embeddingBaseUrl - Base URL for TEI embeddings (required)
 * @param {number} [temperature] - Temperature for completions
 * @param {(url: string, options?: object) => Promise<Response>} [fetchFn] - HTTP client function
 * @param {() => object} [tokenizerFn] - Tokenizer factory function
 * @returns {LlmApi} Configured LlmApi instance
 */
export function createLlmApi(
  token,
  model,
  baseUrl,
  embeddingBaseUrl,
  temperature = 0.3,
  fetchFn = createProxyAwareFetch(),
  tokenizerFn = createTokenizer,
) {
  if (!baseUrl) {
    throw new Error(
      "baseUrl is required. Set LLM_BASE_URL to https://models.github.ai/orgs/{YOUR_ORG} for org-level PATs.",
    );
  }
  if (!embeddingBaseUrl) {
    throw new Error(
      "embeddingBaseUrl is required. Set EMBEDDING_BASE_URL for TEI endpoint.",
    );
  }
  const retry = createRetry();
  return new LlmApi(
    token,
    model,
    baseUrl,
    embeddingBaseUrl,
    retry,
    fetchFn,
    tokenizerFn,
    temperature,
  );
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
