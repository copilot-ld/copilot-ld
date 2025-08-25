/* eslint-env node */
import { TextBase } from "./types.js";

/**
 * Text chunk retrieval service
 * @deprecated This service will be replaced by Assistant, Task, Conversation, and Context services in the new architecture
 */
class TextService extends TextBase {
  #chunkIndex;

  /**
   * Creates a new Text service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {import("@copilot-ld/libchunk").ChunkIndexInterface} chunkIndex - ChunkIndex instance for data access
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, chunkIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    this.#chunkIndex = chunkIndex;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").text.GetChunksRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").text.GetChunksResponse>} Response message
   */
  async GetChunks(req) {
    const chunks = await this.#chunkIndex.getChunks(req.ids);
    return { chunks };
  }
}

/**
 * @deprecated This service will be replaced by Assistant, Task, Conversation, and Context services in the new architecture
 */
export { TextService };
