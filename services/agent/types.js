/* eslint-env node */
import * as libservice from "@copilot-ld/libservice";

/** @typedef {import("@copilot-ld/libconfig").ServiceConfigInterface} ServiceConfigInterface */

/**
 * Base interface for Agent service
 * @implements {libservice.ServiceInterface}
 */
export class AgentServiceInterface extends libservice.ServiceInterface {
  /**
   * Creates a new Agent service instance
   * @param {ServiceConfigInterface} config - Service configuration object
   * @param {object} clients - Service clients object
   * @param {(token: string) => object} octokitFactory - Factory function to create Octokit instances
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   * @throws {Error} Not implemented
   */
  constructor(config, clients, octokitFactory, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
  }

  /**
   * Processes an agent request by coordinating multiple services to generate
   * context-aware responses using RAG (Retrieval Augmented Generation)
   * @param {object} params - Request parameters
   * @param {Array} params.messages - Array of conversation messages
   * @param {string} params.session_id - Optional session ID for conversation continuity
   * @param {string} params.github_token - GitHub authentication token
   * @returns {Promise<object>} Completion response with session ID
   * @throws {Error} Not implemented
   */
  async ProcessRequest({ messages, session_id, github_token }) {
    throw new Error("Not implemented");
  }
}
