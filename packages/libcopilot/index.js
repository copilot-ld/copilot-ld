/* eslint-env node */
import { common } from "@copilot-ld/libtype";
import { countTokens, createTokenizer, createRetry } from "@copilot-ld/libutil";

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
   * @returns {void}
   * @throws {Error} With enriched message including body snippet
   */
  #throwIfNotOk(response) {
    if (response.ok) return;
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  /**
   * Creates chat completions using the LLM API
   * @param {import("copilot-ld/libtype").Message[]} messages - Array of message objects with roles and content
   * @param {import("copilot-ld/libtype").Tool[]} [tools] - Optional array of tool definitions
   * @param {number} [temperature] - Optional sampling temperature
   * @param {number} [max_tokens] - Optional maximum tokens to generate
   * @returns {Promise<object>} Completion response from Copilot
   */
  async createCompletions(messages, tools, temperature, max_tokens) {
    // Convert messages from internal Message format to OpenAI format
    const formattedMessages = messages
      ?.map((m) => {
        if (!m) return null; // Skip null/undefined messages
        return {
          role: m.role || "user",
          content: m.content?.text || String(m.content || ""),
          ...(m.tool_calls && { tool_calls: m.tool_calls }),
          ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
        };
      })
      .filter(Boolean); // Remove null entries

    // Convert tools from internal Tool format to OpenAI format
    const formattedTools = tools?.map((t) => {
      return {
        type: t.type || "function",
        function: {
          name: t.function?.name,
          description: String(t.function?.descriptor || ""),
          ...(t.function?.parameters && { parameters: t.function.parameters }),
        },
      };
    });

    const body = {
      messages: formattedMessages,
      tools: formattedTools,
      temperature,
      max_tokens,
      model: this.#model,
    };

    const response = await this.#retry.execute(() =>
      this.#fetch(`${this.#baseURL}/chat/completions`, {
        method: "POST",
        headers: this.#headers,
        body: JSON.stringify(body),
      }),
    );

    this.#throwIfNotOk(response);

    const json = await response.json();

    // Convert response back to expected format with proper Message instances
    // The monkey patch in libtype automatically converts string content to Content objects
    // BUT preserve original tool_calls structure - don't convert through protobuf
    return {
      ...json,
      choices:
        json.choices?.map((choice) => ({
          ...choice,
          message: {
            ...common.Message.fromObject({
              ...choice.message,
              tool_calls: [], // Remove tool_calls from protobuf conversion
            }),
            tool_calls: choice.message.tool_calls, // Preserve original structure
          },
        })) || [],
    };
  }

  /**
   * Creates embeddings using the LLM API
   * @param {string[]} texts - Array of text strings to embed
   * @returns {Promise<common.Embedding[]>} Array of Embedding instances
   */
  async createEmbeddings(texts) {
    const response = await this.#retry.execute(() =>
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

    this.#throwIfNotOk(response);

    const json = await response.json();
    return json.data.map((item) => {
      const normalizedEmbedding = normalizeVector(item.embedding);
      return new common.Embedding({
        ...item,
        embedding: normalizedEmbedding,
      });
    });
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

    this.#throwIfNotOk(response);
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
export function createLlm(
  token,
  model = "gpt-4o",
  fetchFn = fetch,
  tokenizerFn = createTokenizer,
) {
  const retry = createRetry();
  return new Copilot(token, model, retry, fetchFn, tokenizerFn);
}
