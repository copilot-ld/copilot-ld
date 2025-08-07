/* eslint-env node */
import NodeCache from "node-cache";

import * as libconfig from "@copilot-ld/libconfig";
import * as libservice from "@copilot-ld/libservice";

/**
 * Base interface for History service
 * @implements {libservice.ServiceInterface}
 */
export class HistoryServiceInterface {
  /**
   * Creates a new History service instance
   * @param {libconfig.ServiceConfigInterface} config - Service configuration object
   * @param {NodeCache} cache - Cache instance for storing messages
   * @throws {Error} Not implemented
   */
  constructor(config, cache) {}

  /**
   * Retrieves chat history for a session
   * @param {object} request - Request object containing session ID
   * @param {string} request.session_id - ID of the session to retrieve history for
   * @returns {Promise<object>} Response containing session messages
   * @throws {Error} Not implemented
   */
  async GetHistory({ session_id }) {
    throw new Error("Not implemented");
  }

  /**
   * Updates chat history for a session
   * @param {object} request - Request object containing session data
   * @param {string} request.session_id - ID of the session to update
   * @param {object[]} request.messages - Array of messages to store
   * @returns {Promise<object>} Response indicating success status
   * @throws {Error} Not implemented
   */
  async UpdateHistory({ session_id, messages }) {
    throw new Error("Not implemented");
  }
}
