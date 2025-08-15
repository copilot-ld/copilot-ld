/* eslint-env node */
import * as libconfig from "@copilot-ld/libconfig";
import * as libservice from "@copilot-ld/libservice";

/**
 * Base interface for LLM service
 * @implements {libservice.ServiceInterface}
 */
export class LlmServiceInterface extends libservice.ServiceInterface {
  /**
   * Creates a new LLM service instance
   * @param {libconfig.ServiceConfigInterface} config - Service configuration object
   * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - Factory function to create LLM instances
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   * @throws {Error} Not implemented
   */
  constructor(config, llmFactory, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
  }

  /**
   * Creates completions using the LLM with Prompt objects
   * @param {object} request - Request object containing completion parameters
   * @param {import("@copilot-ld/libprompt").Prompt} request.prompt - Prompt object containing all prompt data
   * @param {number} request.temperature - Sampling temperature
   * @param {string} request.github_token - GitHub token for authentication
   * @returns {Promise<object>} Response containing completion data
   * @throws {Error} Not implemented
   */
  async CreateCompletions(request) {
    throw new Error("Not implemented");
  }

  /**
   * Creates embeddings for text chunks
   * @param {object} request - Request object containing embedding parameters
   * @param {string[]} request.chunks - Array of text chunks to embed
   * @param {string} request.github_token - GitHub token for authentication
   * @returns {Promise<object>} Response containing embedding data
   * @throws {Error} Not implemented
   */
  async CreateEmbeddings({ chunks, github_token }) {
    throw new Error("Not implemented");
  }
}
