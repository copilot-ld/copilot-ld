/**
 * Composed client for Copilot-LD chat functionality.
 * Provides unified access to auth, API, and state services.
 * @module libchat/client
 */

import { ChatAuth } from "./auth.js";
import { ChatApi } from "./api.js";
import { ChatState } from "./state.js";

/**
 * @typedef {object} AuthConfig
 * @property {string} url - GoTrue API base URL
 * @property {string} [anonKey] - Supabase anonymous key (optional)
 */

/**
 * @typedef {object} ClientConfig
 * @property {string} chatUrl - Chat API endpoint
 * @property {AuthConfig} [auth] - Auth configuration (optional, enables authentication)
 * @property {Storage} [storage] - Storage implementation (default: localStorage)
 */

/**
 * @typedef {object} StreamChunk
 * @property {string} [resource_id] - Conversation resource ID
 * @property {Array<object>} [messages] - Message objects
 * @property {string} [error] - Error message
 * @property {string} [details] - Error details
 */

/**
 * Composed client for Copilot-LD chat functionality.
 * Integrates authentication, API communication, and state management.
 * @example
 * const client = new ChatClient({
 *   chatUrl: "/api",
 *   auth: { url: "http://localhost:9999", anonKey: "key" }
 * });
 *
 * for await (const chunk of client.chat("Hello")) {
 *   console.log(chunk);
 * }
 */
export class ChatClient {
  #auth;
  #api;
  #state;

  /**
   * Creates a ChatClient instance.
   * @param {ClientConfig} config - Client configuration
   */
  constructor(config) {
    if (!config) throw new Error("config is required");
    if (!config.chatUrl) throw new Error("config.chatUrl is required");

    const storage = config.storage ?? globalThis.localStorage;

    this.#state = new ChatState(storage);

    if (config.auth?.url) {
      this.#auth = new ChatAuth(
        config.auth.url,
        storage,
        globalThis.fetch.bind(globalThis),
        config.auth.anonKey,
      );
    } else {
      this.#auth = null;
    }

    this.#api = new ChatApi(config.chatUrl, () => this.#auth?.getAccessToken());
  }

  /**
   * Gets the authentication service.
   * @returns {ChatAuth|null} Auth service or null if not configured
   */
  get auth() {
    return this.#auth;
  }

  /**
   * Gets the API service.
   * @returns {ChatApi} API service
   */
  get api() {
    return this.#api;
  }

  /**
   * Gets the state service.
   * @returns {ChatState} State service
   */
  get state() {
    return this.#state;
  }

  /**
   * Sends a message and streams the response.
   * Automatically manages resource ID state.
   * @param {string} message - User message to send
   * @yields {StreamChunk} Response chunks from the API
   */
  async *chat(message) {
    const resourceId = this.#state.resourceId;
    const response = await this.#api.send(message, resourceId);

    for await (const chunk of this.#api.stream(response)) {
      if (chunk.resource_id && !this.#state.resourceId) {
        this.#state.resourceId = chunk.resource_id;
      }
      yield chunk;
    }
  }

  /**
   * Clears conversation state.
   */
  clear() {
    this.#state.clear();
  }

  /**
   * Submits feedback for a message.
   * @param {string} signal - Feedback signal ("positive" or "negative")
   * @param {number} messageIndex - Index of the message being rated
   * @returns {Promise<void>}
   */
  async submitFeedback(signal, messageIndex) {
    const resourceId = this.#state.resourceId;
    if (!resourceId) {
      throw new Error("No active conversation for feedback");
    }
    await this.#api.submitFeedback(signal, resourceId, messageIndex);
  }
}
