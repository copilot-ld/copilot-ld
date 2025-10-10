/* eslint-env node */
import grpc from "@grpc/grpc-js";

import { createLogger } from "@copilot-ld/libutil";

import { Interceptor, HmacAuth } from "./auth.js";
import { definitions } from "./generated/definitions/exports.js";

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Default grpc factory that creates gRPC dependencies
 * @returns {object} Object containing grpc
 */
export function createGrpc() {
  return { grpc };
}

/**
 * Default auth factory that creates authentication interceptor
 * @param {string} serviceName - Name of the service for the interceptor
 * @returns {Interceptor} Configured interceptor instance
 */
export function createAuth(serviceName) {
  const secret = process.env.SERVICE_SECRET;
  if (!secret) {
    throw new Error(
      `SERVICE_SECRET environment variable is required for service ${serviceName}`,
    );
  }
  return new Interceptor(new HmacAuth(secret), serviceName);
}

/**
 * Base class for both Server and Client with shared gRPC functionality
 */
export class Rpc {
  #grpc;
  #auth;
  #logger;

  /**
   * Creates a new Rpc instance
   * @param {object} config - Configuration object
   * @param {() => {grpc: object}} grpcFn - gRPC factory
   * @param {(serviceName: string) => object} authFn - Auth factory
   * @param {(namespace: string) => object} logFn - Log factory
   */
  constructor(
    config,
    grpcFn = createGrpc,
    authFn = createAuth,
    logFn = createLogger,
  ) {
    if (!config) throw new Error("config is required");
    if (grpcFn && typeof grpcFn !== "function")
      throw new Error("createGrpc must be a function");
    if (authFn && typeof authFn !== "function")
      throw new Error("createAuth must be a function");
    if (logFn && typeof logFn !== "function")
      throw new Error("createLogger must be a function");

    this.config = config;

    // Initialize gRPC dependencies
    const { grpc } = grpcFn();
    this.#grpc = grpc;

    // Setup authentication
    this.#auth = authFn(this.config.name);

    // Setup logging
    this.#logger = logFn(this.config.name);
  }

  /**
   * Returns the gRPC instance
   * @returns {object} gRPC instance
   */
  grpc = () => this.#grpc;

  /**
   * Returns the auth instance
   * @returns {object} Auth instance
   */
  auth = () => this.#auth;

  /**
   * Returns the logger instance
   * @returns {object} Logger instance
   */
  logger = () => this.#logger;

  /**
   * Logs a debug message
   * @param {string} message - Message to log
   * @param {object} context - Context to log
   * @returns {void}
   */
  debug = (message, context) => this.#logger.debug(message, context);

  /**
   * Get pre-compiled service definition
   * @param {string} serviceName - Service name (e.g., "Agent", "Vector")
   * @returns {object} Pre-compiled service definition
   */
  getServiceDefinition(serviceName) {
    const definition = definitions[serviceName.toLowerCase()];
    if (!definition) {
      throw new Error(
        `Service definition for ${serviceName} not found. Available: ${Object.keys(definitions).join(", ")}`,
      );
    }
    return definition;
  }
}

/**
 * Creates a gRPC client with consistent API using pre-compiled definitions
 */
export class Client extends Rpc {
  #client;

  /**
   * Creates a new Client instance
   * @param {object} config - Configuration object
   * @param {() => {grpc: object}} grpcFn - gRPC factory
   * @param {(serviceName: string) => object} authFn - Auth factory
   * @param {(namespace: string) => object} logFn - Log factory
   */
  constructor(
    config,
    grpcFn = createGrpc,
    authFn = createAuth,
    logFn = createLogger,
  ) {
    super(config, grpcFn, authFn, logFn);
    this.#setupClient();
  }

  /**
   * Sets up the gRPC client using pre-compiled definition
   * @private
   */
  #setupClient() {
    const serviceName = capitalizeFirstLetter(this.config.name);
    const serviceDefinition = this.getServiceDefinition(serviceName);

    // In case default host is used, resort to a well-known service name
    const host =
      this.config.host === "0.0.0.0"
        ? `${this.config.name}.copilot-ld.local`
        : this.config.host;

    const uri = `${host}:${this.config.port}`;
    const options = {
      interceptors: [this.auth().createClientInterceptor()],
    };
    const clientCredentials = this.grpc().credentials.createInsecure();

    // Create client using pre-compiled service definition
    const ClientConstructor =
      this.grpc().makeGenericClientConstructor(serviceDefinition);
    this.#client = new ClientConstructor(uri, clientCredentials, options);
  }

  /**
   * Call a gRPC method and return a promise
   * @param {string} methodName - The name of the gRPC method to call
   * @param {object} request - The request object to send
   * @returns {Promise<object>} The response from the gRPC call
   */
  async callMethod(methodName, request) {
    if (!this.#client[methodName]) {
      throw new Error(`Method ${methodName} not found on gRPC client`);
    }

    return new Promise((resolve, reject) => {
      this.#client[methodName](request, (error, response) => {
        if (error) {
          this.debug(`gRPC call failed: ${methodName}`, { error });
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}
