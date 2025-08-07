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
export class ActorInterface {
  /**
   * Creates a new base service instance
   * @param {ServiceConfigInterface} config - Service configuration object
   * @param {Function} grpcFn - Function that returns gRPC dependencies (optional, defaults to grpcFactory)
   * @param {Function} authFn - Function that returns auth instance (optional, defaults to authFactory)
   */
  constructor(config, grpcFn, authFn) {
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
export class ClientInterface extends ActorInterface {
  /**
   * Creates a new gRPC client instance with automatic method wrapping
   * @param {ServiceConfigInterface} config - Service configuration object
   * @param {Function} grpcFn - Function that returns gRPC dependencies (optional, defaults to grpcFactory)
   * @param {Function} authFn - Function that returns auth instance (optional, defaults to authFactory)
   */
  constructor(config, grpcFn, authFn) {
    super(config, grpcFn, authFn);
  }

  /**
   * Ensures client is set up before use
   * @returns {Promise<void>}
   */
  async ensureReady() {
    throw new Error("Not implemented");
  }
}

/**
 * Base interface for gRPC services
 */
export class ServiceInterface extends ActorInterface {
  /**
   * Creates a new gRPC service instance
   * @param {ServiceConfigInterface} config - Service configuration object
   * @param {Function} grpcFn - Function that returns gRPC dependencies (optional, defaults to grpcFactory)
   * @param {Function} authFn - Function that returns auth instance (optional, defaults to authFactory)
   */
  constructor(config, grpcFn, authFn) {
    super(config, grpcFn, authFn);
  }

  /**
   * Builds and starts the service with automatic handler discovery
   * @returns {Promise<number>} The port the server is listening on
   */
  async start() {
    throw new Error("Not implemented");
  }
}
