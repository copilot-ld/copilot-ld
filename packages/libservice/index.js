/* eslint-env node */
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

import { Interceptor, HmacAuth } from "./auth.js";
import { ClientInterface, ServiceInterface, ActorInterface } from "./types.js";

/**
 * Creates a client with a service configuration
 * @param {string} serviceName - Name of the service
 * @param {object} defaults - Default configuration values
 * @param {() => {grpc: object, protoLoader: object}} grpcFn - Grpc factory function
 * @param {(serviceName: string) => object} authFn - Optional auth factory function
 * @param {(namespace: string) => object} logFn - Optional log factory function
 * @returns {Promise<Client>} Configured client instance
 */
export async function createClient(
  serviceName,
  defaults = {},
  grpcFn,
  authFn,
  logFn,
) {
  const config = await ServiceConfig.create(serviceName, defaults);
  return new Client(config, grpcFn, authFn, logFn);
}

/**
 * Default grpc factory that creates gRPC dependencies
 * @returns {object} Object containing grpc and protoLoader
 */
function grpcFactory() {
  return { grpc, protoLoader };
}

/**
 * Default auth factory that creates authentication interceptor
 * @param {string} serviceName - Name of the service for the interceptor
 * @returns {Interceptor} Configured interceptor instance
 */
function authFactory(serviceName) {
  const secret = process.env.SERVICE_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      `SERVICE_AUTH_SECRET environment variable is required for service ${serviceName}`,
    );
  }
  return new Interceptor(new HmacAuth(secret), serviceName);
}

/**
 * Base class for both Service and Client with shared functionality
 * @implements {ActorInterface}
 */
export class Actor extends ActorInterface {
  #grpc;
  #protoLoader;
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
    const { grpc, protoLoader } = grpcFn();
    this.#grpc = grpc;
    this.#protoLoader = protoLoader;

    // Setup authentication
    this.#auth = authFn(this.config.name);

    // Setup logging
    this.#logger = logFn(this.config.name);
  }

  /** @inheritdoc */
  grpc = () => this.#grpc;

  /** @inheritdoc */
  protoLoader = () => this.#protoLoader;

  /** @inheritdoc */
  auth = () => this.#auth;

  /** @inheritdoc */
  logger = () => this.#logger;

  /** @inheritdoc */
  debug = (message, context) => this.#logger.debug(message, context);

  /** @inheritdoc */
  async loadProto(key) {
    const storage = storageFactory("proto", "local");
    const filename = await storage.path(key);

    const serviceName = key.replace(".proto", "");
    const packageDefinition = this.grpc().loadPackageDefinition(
      this.protoLoader().loadSync(filename, {
        keepCase: true,
        longs: String,
        enums: String,
      }),
    );

    return packageDefinition[serviceName];
  }
}

/**
 * Creates a gRPC client with consistent API
 * @implements {ClientInterface}
 */
export class Client extends Actor {
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
   * Sets up the gRPC client
   * @private
   */
  async #setupClient() {
    try {
      const proto = await this.loadProto(`${this.config.name}.proto`);
      const ServiceClass = proto[capitalizeFirstLetter(this.config.name)];

      if (!ServiceClass) {
        throw new Error(
          `Service ${capitalizeFirstLetter(this.config.name)} not found in proto/${this.config.name}.proto`,
        );
      }

      const uri = `${this.config.host}:${this.config.port}`;
      const options = {
        interceptors: [this.auth().createClientInterceptor()],
      };
      const clientCredentials = this.grpc().credentials.createInsecure();
      this.#client = new ServiceClass(uri, clientCredentials, options);
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
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

/**
 * Base Service class for all gRPC services
 * Generated service base classes extend this class
 * @implements {ServiceInterface}
 */
export class Service extends Actor {
  #server;
  #started = false;

  constructor(
    config,
    grpcFn = grpcFactory,
    authFn = authFactory,
    logFn = logFactory,
  ) {
    super(config, grpcFn, authFn, logFn);
  }

  async start(serviceDefinition, handlers) {
    if (this.#started) throw new Error("Server is already started");

    this.#server = new (this.grpc().Server)();

    // If no parameters provided, use legacy behavior for backward compatibility
    if (!serviceDefinition || !handlers) {
      const proto = await this.loadProto(this.config.name);
      serviceDefinition = this.#getServiceDefinition(proto);
      handlers = this.#createHandlers(serviceDefinition);
    } else {
      // Wrap provided handlers with centralized auth/error handling when needed
      handlers = this.#wrapProvidedHandlers(serviceDefinition, handlers);
    }

    this.#server.addService(serviceDefinition, handlers);

    const uri = `${this.config.host}:${this.config.port}`;
    const port = await this.#bindServer(uri);

    this.#setupShutdown();
    this.#started = true;
    return port;
  }

  /**
   * Gets service definition from proto
   * @param {object} proto - Loaded proto definition
   * @returns {object} Service definition
   */
  #getServiceDefinition(proto) {
    const ServiceClass = proto[capitalizeFirstLetter(this.config.name)];
    if (!ServiceClass) {
      throw new Error(
        `Service ${capitalizeFirstLetter(this.config.name)} not found in proto/${this.config.name}.proto`,
      );
    }
    return ServiceClass.service;
  }

  /**
   * Binds server to address and port
   * @param {string} uri - Server URI
   * @returns {Promise<number>} Bound port
   */
  async #bindServer(uri) {
    return new Promise((resolve, reject) => {
      this.#server.bindAsync(
        uri,
        this.grpc().ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) reject(error);
          else {
            this.debug("Listening on", { uri });
            resolve(port);
          }
        },
      );
    });
  }

  /**
   * Creates handlers for all RPC methods
   * @param {object} serviceDefinition - Service definition from proto
   * @returns {object} Handler functions mapped by method name
   */
  #createHandlers(serviceDefinition) {
    const rpcMethods = Object.keys(serviceDefinition);
    const handlers = {};
    for (const methodName of rpcMethods) {
      if (typeof this[methodName] !== "function") {
        throw new Error(`Missing RPC method implementation: ${methodName}`);
      }
      handlers[methodName] = this.#createHandler(methodName);
    }
    return handlers;
  }

  /**
   * Creates a single handler that delegates to the implementation after centralized auth/error handling
   * @param {string} methodName - Method name
   * @returns {Function} Handler function
   */
  #createHandler(methodName) {
    // Inner handler receives the gRPC call and returns a response (or throws)
    const inner = async (call) =>
      await this[methodName](call.request, call.metadata, call);
    return this.#wrapUnary(inner);
  }

  /**
   * Wraps provided handlers with centralized auth/error handling.
   * If a provided handler already follows gRPC signature (call, callback), it is used as-is.
   * If it is a simplified handler (call) => Promise<Response>, it will be wrapped.
   * @param {object} serviceDefinition - Service definition object from generated proto (ServiceClass.service)
   * @param {object} providedHandlers - Map of rpcName => handler function provided by caller
   * @returns {object} Wrapped handlers ready for addService
   */
  #wrapProvidedHandlers(serviceDefinition, providedHandlers) {
    const rpcMethods = Object.keys(serviceDefinition);
    const handlers = {};
    for (const methodName of rpcMethods) {
      const handler = providedHandlers[methodName];
      if (!handler) {
        throw new Error(`Missing RPC handler implementation: ${methodName}`);
      }

      // Heuristic: if function expects >=2 args, assume (call, callback) gRPC-style and use directly
      if (typeof handler === "function" && handler.length >= 2) {
        handlers[methodName] = handler;
      } else {
        // Otherwise treat as simplified (call) => resp and wrap
        handlers[methodName] = this.#wrapUnary(handler.bind(this));
      }
    }
    return handlers;
  }

  /**
   * Central wrapper for unary RPC handlers adding auth validation and error handling.
   * @param {(call: object) => Promise<object>} innerHandler - Simplified handler that returns a response
   * @returns {(call: object, callback: Function) => Promise<void>} gRPC-compatible handler
   */
  #wrapUnary(innerHandler) {
    return async (call, callback) => {
      // Authenticate once for all handlers
      const validation = this.auth().validateCall(call);
      if (!validation.isValid) {
        return callback({
          code: this.grpc().status.UNAUTHENTICATED,
          message: `Authentication failed: ${validation.error}`,
        });
      }

      call.authenticatedServiceId = validation.serviceId;

      try {
        const response = await innerHandler(call);
        callback(null, response);
      } catch (error) {
        this.debug("RPC handler error", {
          error: error?.message || String(error),
        });
        callback({
          code: this.grpc().status.INTERNAL,
          message: error?.message || String(error),
        });
      }
    };
  }

  /**
   * Sets up graceful shutdown handlers
   */
  #setupShutdown() {
    const shutdown = () => {
      this.debug("Shutting down...");
      this.#server.tryShutdown(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}

/**
 * Helper function to capitalize first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} String with first letter capitalized
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export {
  ActorInterface,
  ClientInterface,
  ServiceInterface,
  HmacAuth,
  Interceptor,
};
