/* eslint-env node */
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { ServiceConfig } from "@copilot-ld/libconfig";

import { Interceptor, HmacAuth } from "./auth.js";
import { ClientInterface, ServiceInterface, ActorInterface } from "./types.js";

/**
 * Default gRPC factory that creates gRPC dependencies
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

  /** @inheritdoc */
  constructor(config, grpcFn = grpcFactory, authFn = authFactory) {
    super(config, grpcFn, authFn);

    if (!config) throw new Error("config is required");
    if (grpcFn && typeof grpcFn !== "function")
      throw new Error("grpcFactory must be a function");
    if (authFn && typeof authFn !== "function")
      throw new Error("authFactory must be a function");

    this.config = config;

    // Initialize gRPC dependencies
    const { grpc, protoLoader } = grpcFn();
    this.#grpc = grpc;
    this.#protoLoader = protoLoader;

    // Setup authentication
    this.#auth = authFn(this.config.name);
  }

  /** @inheritdoc */
  grpc = () => this.#grpc;

  /** @inheritdoc */
  protoLoader = () => this.#protoLoader;

  /** @inheritdoc */
  auth = () => this.#auth;

  /** @inheritdoc */
  async loadProto(serviceName) {
    const filename = this.config.protoFile(serviceName);

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
  constructor(config, grpcFn = grpcFactory, authFn = authFactory) {
    super(config, grpcFn, authFn);
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
      const proto = await this.loadProto(this.config.name);
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
      this.#setupMethods();
    } catch (error) {
      this.#setupPromise = null;
      throw error;
    }
  }

  /**
   * Sets up promisified methods and fire-and-forget variants
   */
  #setupMethods() {
    this.fireAndForget = {};

    // Get methods from both prototype and instance
    const prototypeMethodNames = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this.#client),
    ).filter(
      (key) => key !== "constructor" && typeof this.#client[key] === "function",
    );

    const instanceMethodNames = Object.getOwnPropertyNames(this.#client).filter(
      (key) => typeof this.#client[key] === "function",
    );

    const methodNames = [
      ...new Set([...prototypeMethodNames, ...instanceMethodNames]),
    ];

    for (const method of methodNames) {
      this[method] = this.#createPromisifiedMethod(method);
      this.fireAndForget[method] = this.#createFireAndForgetMethod(method);
    }
  }

  /**
   * Creates a promisified version of a gRPC method
   * @param {string} method - Method name
   * @returns {Function} Promisified method
   */
  #createPromisifiedMethod(method) {
    return async (...args) => {
      await this.ensureReady();
      return new Promise((resolve, reject) => {
        this.#client[method](...args, (error, response) => {
          if (error) reject(error);
          else resolve(response);
        });
      });
    };
  }

  /**
   * Creates a fire-and-forget version of a gRPC method
   * @param {string} method - Method name
   * @returns {Function} Fire-and-forget method
   */
  #createFireAndForgetMethod(method) {
    return async (...args) => {
      await this.ensureReady();
      this.#client[method](...args, () => {});
    };
  }
}

/**
 * Creates a standardized gRPC service with minimal boilerplate
 * @implements {ServiceInterface}
 */
export class Service extends Actor {
  #server;
  #started = false;

  /** @inheritdoc */
  constructor(config, grpcFn = grpcFactory, authFn = authFactory) {
    super(config, grpcFn, authFn);
  }

  /** @inheritdoc */
  async start() {
    if (this.#started) throw new Error("Server is already started");

    this.#server = new (this.grpc().Server)();
    const proto = await this.loadProto(this.config.name);
    const serviceDefinition = this.#getServiceDefinition(proto);
    const handlers = this.#createHandlers(serviceDefinition);
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
            console.log(`Listening on: ${uri}`);
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
   * Creates a single handler with authentication
   * @param {string} methodName - Method name
   * @returns {Function} Handler function
   */
  #createHandler(methodName) {
    return async (call, callback) => {
      const validation = this.auth().validateCall(call);
      if (!validation.isValid) {
        return callback({
          code: this.grpc().status.UNAUTHENTICATED,
          message: `Authentication failed: ${validation.error}`,
        });
      }

      call.authenticatedServiceId = validation.serviceId;

      try {
        const resp = await this[methodName](call.request, call.metadata, call);
        callback(null, resp);
      } catch (error) {
        console.error("Error:", error);
        callback({ code: this.grpc().status.INTERNAL, message: error.message });
      }
    };
  }

  /**
   * Sets up graceful shutdown handlers
   */
  #setupShutdown() {
    const shutdown = () => {
      console.log("Shutting down...");
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

/**
 * Creates a client with proper configuration
 * @param {string} serviceName - Name of the service to connect to
 * @param {object} defaults - Optional configuration overrides
 * @param {Function} grpcFactoryFn - Optional gRPC factory function
 * @param {Function} authFactoryFn - Optional auth factory function
 * @returns {Client} Configured client instance
 */
export function createClient(
  serviceName,
  defaults = {},
  grpcFactoryFn,
  authFactoryFn,
) {
  const config = new ServiceConfig(serviceName, defaults);
  return new Client(config, grpcFactoryFn, authFactoryFn);
}

export {
  ActorInterface,
  ClientInterface,
  ServiceInterface,
  HmacAuth,
  Interceptor,
};
