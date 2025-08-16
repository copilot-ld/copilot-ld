/* eslint-env node */
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

import { Interceptor, HmacAuth } from "@copilot-ld/libservice";

/**
 * Base class for Text service with proto-specific method stubs
 * Eliminates the need for complex dynamic schema registry
 */
export class TextBase {
  #server;
  #started = false;
  #grpc;
  #protoLoader;
  #auth;
  #logger;

  /**
   * Creates a new Text service base
   * @param {object} config - Service configuration object
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(config, grpcFn, authFn, logFn) {
    if (!config) throw new Error("config is required");
    if (grpcFn && typeof grpcFn !== "function")
      throw new Error("grpcFactory must be a function");
    if (authFn && typeof authFn !== "function")
      throw new Error("authFactory must be a function");
    if (logFn && typeof logFn !== "function")
      throw new Error("logFactory must be a function");

    this.config = config;

    // Initialize gRPC dependencies
    const { grpc, protoLoader } = grpcFn
      ? grpcFn()
      : this.#defaultGrpcFactory();
    this.#grpc = grpc;
    this.#protoLoader = protoLoader;

    // Setup authentication
    this.#auth = authFn
      ? authFn(this.config.name)
      : this.#defaultAuthFactory(this.config.name);

    // Setup logging
    this.#logger = logFn
      ? logFn(this.config.name)
      : logFactory(this.config.name);
  }

  /**
   * Default grpc factory
   * @returns {object} Object containing grpc and protoLoader
   * @private
   */
  #defaultGrpcFactory() {
    return { grpc, protoLoader };
  }

  /**
   * Default auth factory
   * @param {string} serviceName - Name of the service for the interceptor
   * @returns {Interceptor} Configured interceptor instance
   * @private
   */
  #defaultAuthFactory(serviceName) {
    const secret = process.env.SERVICE_AUTH_SECRET;
    if (!secret) {
      throw new Error(
        `SERVICE_AUTH_SECRET environment variable is required for service ${serviceName}`,
      );
    }
    return new Interceptor(new HmacAuth(secret), serviceName);
  }

  /**
   * Debug logging method
   * @param {string} message - Log message
   * @param {object} context - Additional context
   */
  debug(message, context) {
    this.#logger.debug(message, context);
  }

  /**
   * Load proto definition for text service
   * @returns {Promise<object>} Proto definition
   */
  async loadProto() {
    const storage = storageFactory("proto", "local");
    const filename = await storage.path("text.proto");

    const packageDefinition = this.#grpc.loadPackageDefinition(
      this.#protoLoader.loadSync(filename, {
        keepCase: true,
        longs: String,
        enums: String,
      }),
    );

    return packageDefinition.text;
  }

  /**
   * Start the gRPC server
   * @returns {Promise<number>} Port number the server is listening on
   */
  async start() {
    if (this.#started) throw new Error("Server is already started");

    this.#server = new this.#grpc.Server();
    const proto = await this.loadProto();
    const serviceDefinition = proto.Text.service;

    // Create handlers for all RPC methods
    const handlers = {};
    handlers.GetChunks = this.#createHandler("GetChunks");

    this.#server.addService(serviceDefinition, handlers);

    const uri = `${this.config.host}:${this.config.port}`;
    const port = await this.#bindServer(uri);

    this.#setupShutdown();
    this.#started = true;
    return port;
  }

  /**
   * Binds server to address and port
   * @param {string} uri - Server URI
   * @returns {Promise<number>} Bound port
   * @private
   */
  async #bindServer(uri) {
    return new Promise((resolve, reject) => {
      this.#server.bindAsync(
        uri,
        this.#grpc.ServerCredentials.createInsecure(),
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
   * Creates a single handler with authentication
   * @param {string} methodName - Method name
   * @returns {Function} Handler function
   * @private
   */
  #createHandler(methodName) {
    return async (call, callback) => {
      const validation = this.#auth.validateCall(call);
      if (!validation.isValid) {
        return callback({
          code: this.#grpc.status.UNAUTHENTICATED,
          message: `Authentication failed: ${validation.error}`,
        });
      }

      call.authenticatedServiceId = validation.serviceId;

      try {
        if (typeof this[methodName] !== "function") {
          throw new Error(`Missing RPC method implementation: ${methodName}`);
        }
        const resp = await this[methodName](call.request, call.metadata, call);
        callback(null, resp);
      } catch (error) {
        console.error("Error:", error);
        callback({ code: this.#grpc.status.INTERNAL, message: error.message });
      }
    };
  }

  /**
   * Sets up graceful shutdown handlers
   * @private
   */
  #setupShutdown() {
    const shutdown = () => {
      console.log("Shutting down...");
      this.#server.tryShutdown(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  // Proto-specific method stubs - implement these in your service class
  /**
   * GetChunks RPC method
   * @param {object} _request - GetChunksRequest message
   * @param {object} _metadata - gRPC metadata
   * @param {object} _call - gRPC call object
   * @returns {Promise<object>} GetChunksResponse response
   */
  async GetChunks(_request, _metadata, _call) {
    throw new Error("GetChunks method must be implemented by subclass");
  }
}
