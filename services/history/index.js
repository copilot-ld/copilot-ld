/* eslint-env node */
import NodeCache from "node-cache";

import { Service } from "@copilot-ld/libservice";

import { HistoryServiceInterface } from "./types.js";

/**
 * Chat history management service with caching
 * @implements {HistoryServiceInterface}
 */
class HistoryService extends Service {
  #cache;

  /**
   * Creates a new History service instance
   * @param {object} config - Service configuration object
   * @param {NodeCache} cache - Cache instance for storing messages
   */
  constructor(config, cache) {
    super(config);
    this.#cache = cache;
  }

  /**
   * Retrieves chat history for a session
   * @param {object} request - Request object containing session ID
   * @param {string} request.session_id - ID of the session to retrieve history for
   * @returns {Promise<object>} Response containing session messages
   */
  async GetHistory({ session_id }) {
    const messages = this.#cache.get(session_id);
    return { messages };
  }

  /**
   * Updates chat history for a session
   * @param {object} request - Request object containing session data
   * @param {string} request.session_id - ID of the session to update
   * @param {object[]} request.messages - Array of messages to store
   * @returns {Promise<object>} Response indicating success status
   */
  async UpdateHistory({ session_id, messages }) {
    const success = this.#cache.set(session_id, messages);
    return { success };
  }
}

export { HistoryService, HistoryServiceInterface };
