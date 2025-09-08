/* eslint-env node */

/** @typedef {import("@grpc/grpc-js").Server} GrpcServer */
/** @typedef {import("@grpc/grpc-js").Client} GrpcClient */
/** @typedef {import("@grpc/grpc-js").ServerCredentials} ServerCredentials */
/** @typedef {import("@grpc/grpc-js").ServiceDefinition} ServiceDefinition */
/** @typedef {import("@copilot-ld/libconfig").ServiceConfigInterface} ServiceConfigInterface */
/** @typedef {import("./auth.js").Interceptor} Interceptor */

/**
 * Base interface for gRPC services and clients with shared functionality
 */
export class RpcInterface {
  /**
   * Creates a new base RPC instance
   * @param {ServiceConfigInterface} config - Service configuration object
   * @param {() => {grpc: object, protoLoader: object}} grpcFn - Function that returns gRPC dependencies (optional, defaults to grpcFactory)
   * @param {(serviceName: string) => object} authFn - Function that returns auth instance (optional, defaults to authFactory)
   * @param {(namespace: string) => object} logFn - Function that returns logger instance (optional, defaults to logFactory)
   */
  constructor(config, grpcFn, authFn, logFn) {
    // Interface constructor - empty implementation
  }

  /**
   * Gets the gRPC instance
   */
  grpc() {
    throw new Error("Not implemented");
  }

  /**
   * Gets the proto loader instance
   */
  protoLoader() {
    throw new Error("Not implemented");
  }

  /**
   * Gets the auth instance
   */
  auth() {
    throw new Error("Not implemented");
  }

  /**
   * Logs debug messages with namespace support
   * @param {string} message - Debug message
   * @param {object} [context] - Optional context object with key/value pairs
   */
  debug(message, context) {
    throw new Error("Not implemented");
  }

  /**
   * Loads proto definition with standard options using a config object
   * @param {string} serviceName - Name of the service to load proto for
   * @returns {Promise<object>} Loaded proto package definition
   */
  async loadProto(serviceName) {
    throw new Error("Not implemented");
  }
}

/**
 * Base interface for gRPC clients
 */
export class ClientInterface extends RpcInterface {
  /**
   * Creates a new gRPC client instance with automatic method wrapping
   * @param {ServiceConfigInterface} config - Service configuration object
   * @param {() => {grpc: object, protoLoader: object}} grpcFn - Function that returns gRPC dependencies (optional, defaults to grpcFactory)
   * @param {(serviceName: string) => object} authFn - Function that returns auth instance (optional, defaults to authFactory)
   * @param {(namespace: string) => object} logFn - Function that returns logger instance (optional, defaults to logFactory)
   */
  constructor(config, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
  }

  /**
   * Ensures client is set up before use
   * @returns {Promise<void>}
   */
  async ensureReady() {
    throw new Error("Not implemented");
  }
}
