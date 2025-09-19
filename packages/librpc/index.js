/* eslint-env node */
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

import { Interceptor, HmacAuth } from "./auth.js";
import { ClientInterface, RpcInterface } from "./types.js";

/**
 * Default grpc factory that creates gRPC dependencies
 * @returns {object} Object containing grpc and protoLoader
 */
export function grpcFactory() {
  return { grpc, protoLoader };
}

/**
 * Default auth factory that creates authentication interceptor
 * @param {string} serviceName - Name of the service for the interceptor
 * @returns {Interceptor} Configured interceptor instance
 */
export function authFactory(serviceName) {
  const secret = process.env.SERVICE_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      `SERVICE_AUTH_SECRET environment variable is required for service ${serviceName}`,
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

      // In case default host is used, resort to service name for resolution
      const host =
        this.config.host === "0.0.0.0" ? this.name : this.config.host;

      const uri = `${host}:${this.config.port}`;
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
          this.debug("gRPC client call failed", {
            service: this.config.name,
            method: methodName,
            stack: error.stack,
          });
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

/**
 * gRPC Server class for hosting services
 * Takes a service instance and creates a gRPC server around it
 */
export class Server {
  #grpc;
  #auth;
  #logger;
  #server;
  #service;

  /**
   * Creates a gRPC server for a service
   * @param {object} service - Service instance with business logic
   * @param {object} config - Server configuration
   * @param {() => {grpc: object, protoLoader: object}} grpcFn - gRPC factory
   * @param {(serviceName: string) => object} authFn - Auth factory
   * @param {(namespace: string) => object} logFn - Log factory
   */
  constructor(
    service,
    config,
    grpcFn = grpcFactory,
    authFn = authFactory,
    logFn = logFactory,
  ) {
    if (!service) throw new Error("service is required");
    if (!config) throw new Error("config is required");

    this.#service = service;
    this.config = config;

    const { grpc } = grpcFn();
    this.#grpc = grpc;
    this.#auth = authFn(config.name);
    this.#logger = logFn(config.name);
  }

  async start() {
    this.#server = new this.#grpc.Server();

    // Load proto and get service definition
    const definition = await this.#loadServiceDefinition();

    // Get handlers from the service instance
    const handlers = this.#service.getHandlers();

    // Wrap handlers with auth/error handling
    const wrappedHandlers = this.#wrapHandlers(handlers);

    this.#server.addService(definition, wrappedHandlers);

    const uri = `${this.config.host}:${this.config.port}`;
    await this.#bindServer(uri);

    this.#setupShutdown();
  }

  async #loadServiceDefinition() {
    const protoName = this.#service.getProtoName();
    const storage = storageFactory("proto", "local");
    const protoPath = await storage.path(protoName);

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
    });

    const proto = this.#grpc.loadPackageDefinition(packageDefinition);

    // Extract service definition from proto
    // This assumes service name matches proto name (e.g., llm.proto -> llm.Llm)
    const serviceName = protoName.replace(".proto", "");
    const serviceNameCapitalized =
      serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
    return proto[serviceName][serviceNameCapitalized].service;
  }

  #wrapHandlers(handlers) {
    const wrapped = {};
    for (const [method, handler] of Object.entries(handlers)) {
      wrapped[method] = this.#wrapUnary(handler);
    }
    return wrapped;
  }

  #wrapUnary(handler) {
    return async (call, callback) => {
      // Authenticate
      const validation = this.#auth.validateCall(call);
      if (!validation.isValid) {
        return callback({
          code: this.#grpc.status.UNAUTHENTICATED,
          message: `Authentication failed: ${validation.error}`,
        });
      }

      try {
        const response = await handler(call);
        callback(null, response);
      } catch (error) {
        this.#logger.debug("RPC handler error", {
          error: error?.message || String(error),
        });
        callback({
          code: this.#grpc.status.INTERNAL,
          message: error?.message || String(error),
        });
      }
    };
  }

  async #bindServer(uri) {
    return new Promise((resolve, reject) => {
      this.#server.bindAsync(
        uri,
        this.#grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) reject(error);
          else {
            this.#logger.debug("Server listening", { uri });
            resolve(port);
          }
        },
      );
    });
  }

  #setupShutdown() {
    const shutdown = () => {
      this.#logger.debug("Shutting down...");
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

export { RpcInterface, ClientInterface, HmacAuth, Interceptor };
