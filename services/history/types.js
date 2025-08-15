/* eslint-env node */
import * as libconfig from "@copilot-ld/libconfig";
import * as libservice from "@copilot-ld/libservice";
import * as libstorage from "@copilot-ld/libstorage";

/**
 * Base interface for History service
 * @implements {libservice.ServiceInterface}
 */
export class HistoryServiceInterface extends libservice.ServiceInterface {
  /**
   * Creates a new History service instance
   * @param {libconfig.ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libprompt").PromptStorage} promptStorage - Prompt storage instance
   * @param {import("@copilot-ld/libprompt").PromptOptimizer} promptOptimizer - Prompt optimizer instance
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   * @throws {Error} Not implemented
   */
  constructor(config, promptStorage, promptOptimizer, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
  }

  /**
   * Retrieves chat history as a prompt for a session
   * @param {object} request - Request object containing session ID
   * @param {string} request.session_id - ID of the session to retrieve history for
   * @returns {Promise<object>} Response containing prompt object
   * @throws {Error} Not implemented
   */
  async GetHistory({ session_id }) {
    throw new Error("Not implemented");
  }

  /**
   * Updates chat history with a new prompt
   * @param {object} request - Request object containing session data
   * @param {string} request.session_id - ID of the session to update
   * @param {import("@copilot-ld/libprompt").Prompt} request.prompt - Prompt object to store
   * @param {string} request.github_token - GitHub token for LLM optimization
   * @returns {Promise<object>} Response indicating success status and optimization
   * @throws {Error} Not implemented
   */
  async UpdateHistory({ session_id, prompt, github_token }) {
    throw new Error("Not implemented");
  }
}
