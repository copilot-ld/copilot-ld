/**
 * API client for chat communication.
 * Handles HTTP requests to the chat API endpoint.
 * @module libchat/api
 */

/**
 * @typedef {object} StreamChunk
 * @property {string} [resource_id] - Conversation resource ID
 * @property {Array<object>} [messages] - Message objects
 * @property {string} [error] - Error message
 * @property {string} [details] - Error details
 */

/**
 * API client for chat communication.
 * @example
 * const api = new ChatApi("/api", () => authToken);
 * const response = await api.send("Hello", null);
 * for await (const chunk of api.stream(response)) {
 *   console.log(chunk);
 * }
 */
export class ChatApi {
  #url;
  #getToken;

  /**
   * Creates a ChatApi instance.
   * @param {string} url - Chat API base URL
   * @param {() => string|null|Promise<string|null>} [getToken] - Token provider function
   */
  constructor(url, getToken = null) {
    if (!url) throw new Error("url is required");
    this.#url = url;
    this.#getToken = getToken;
  }

  /**
   * Sends a chat message to the API.
   * @param {string} message - User message
   * @param {string|null} resourceId - Conversation resource ID
   * @returns {Promise<Response>} Fetch response with streaming body
   */
  async send(message, resourceId) {
    const token = await this.#getToken?.();
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.#url}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        resource_id: resourceId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Reads a streaming response line by line.
   * @param {Response} response - Fetch response
   * @yields {StreamChunk} Parsed JSON objects
   */
  async *stream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          yield JSON.parse(line);
        }
      }
    }

    if (buffer.trim()) {
      yield JSON.parse(buffer);
    }
  }
}

/**
 * Formats a message for display.
 * @param {object} msg - Message object from API
 * @returns {string} Formatted content
 */
export function formatMessage(msg) {
  if (msg.tool_calls?.length) {
    const tools = msg.tool_calls.map((tc) => tc.function.name).join(", ");
    return msg.content || `Calling tools: ${tools}`;
  }
  if (msg.role === "tool") {
    return `Tool Result: ${msg.content}`;
  }
  return msg.content || "";
}
