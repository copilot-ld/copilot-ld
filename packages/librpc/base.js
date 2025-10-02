/* eslint-env node */
import grpc from "@grpc/grpc-js";

import { logFactory } from "@copilot-ld/libutil";

import { Interceptor, HmacAuth } from "./auth.js";
import { RpcInterface, ClientInterface } from "./types.js";

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
export function grpcFactory() {
  return { grpc };
}

/**
 * Default auth factory that creates authentication interceptor
 * @param {string} serviceName - Name of the service for the interceptor
 * @returns {Interceptor} Configured interceptor instance
 */
export function authFactory(serviceName) {
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
 * @implements {RpcInterface}
 */
export class Rpc extends RpcInterface {
  #grpc;
  #auth;
  #logger;

  /** @inheritdoc */
  constructor(
    config,
    grpcFn = grpcFactory,
    authFn = authFactory,
    logFn = logFactory,
  ) {
    super(config, grpcFn, authFn, logFn);

    if (!config) throw new Error("config is required");
    if (grpcFn && typeof grpcFn !== "function")
      throw new Error("grpcFactory must be a function");
    if (authFn && typeof authFn !== "function")
      throw new Error("authFactory must be a function");
    if (logFn && typeof logFn !== "function")
      throw new Error("logFactory must be a function");

    this.config = config;

    // Initialize gRPC dependencies
    const { grpc } = grpcFn();
    this.#grpc = grpc;

    // Setup authentication
    this.#auth = authFn(this.config.name);

    // Setup logging
    this.#logger = logFn(this.config.name);
  }

  /** @inheritdoc */
  grpc = () => this.#grpc;

  /** @inheritdoc */
  auth = () => this.#auth;

  /** @inheritdoc */
  logger = () => this.#logger;

  /** @inheritdoc */
  debug = (message, context) => this.#logger.debug(message, context);

  /**
   * Get pre-compiled service definition
   * @param {string} serviceName - Service name (e.g., "Agent", "Vector")
   * @returns {object} Pre-compiled service definition
   */
  async getServiceDefinition(serviceName) {
    // Import definitions dynamically to avoid circular dependency
    const { definitions } = await import("./generated/definitions/exports.js");
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
 * @implements {ClientInterface}
 */
export class Client extends Rpc {
  #client;
  #setupPromise;

  /** @inheritdoc */
  constructor(
    config,
    grpcFn = grpcFactory,
    authFn = authFactory,
    logFn = logFactory,
  ) {
    super(config, grpcFn, authFn, logFn);
  }

  /** @inheritdoc */
  async ensureReady() {
    if (!this.#setupPromise) this.#setupPromise = this.#setupClient();
    return this.#setupPromise;
  }

  /**
   * Sets up the gRPC client using pre-compiled definition
   * @private
   */
  async #setupClient() {
    try {
      const serviceName = capitalizeFirstLetter(this.config.name);
      const serviceDefinition = await this.getServiceDefinition(serviceName);

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
    } catch (error) {
      this.#setupPromise = null;
      throw error;
    }
  }

  /**
   * Call a gRPC method and return a promise
   * @param {string} methodName - The name of the gRPC method to call
   * @param {object} request - The request object to send
   * @returns {Promise<object>} The response from the gRPC call
   */
  async callMethod(methodName, request) {
    await this.ensureReady();

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
