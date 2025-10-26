/* eslint-env node */
import grpc from "@grpc/grpc-js";

import { createLogger } from "@copilot-ld/libutil";

import { createAuth } from "./base.js";
import * as exports from "./generated/services/exports.js";
import * as definitionsExports from "./generated/definitions/exports.js";

export { createGrpc, createAuth, Rpc, Client } from "./base.js";
export { Interceptor, HmacAuth } from "./auth.js";

/**
 * gRPC Server class using pre-compiled service definitions
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
   * @param {() => {grpc: object}} grpcFn - gRPC factory
   * @param {(serviceName: string) => object} authFn - Auth factory
   * @param {(namespace: string) => object} logFn - Log factory
   */
  constructor(
    service,
    config,
    grpcFn = () => ({ grpc }),
    authFn = createAuth,
    logFn = createLogger,
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

  /**
   *
   */
  async start() {
    this.#server = new this.#grpc.Server();

    // Get pre-compiled service definition
    const definition = this.#getServiceDefinition();

    // Get handlers from the service instance
    const handlers = this.#service.getHandlers();

    // Wrap handlers with auth/error handling
    const wrappedHandlers = this.#wrapHandlers(handlers);

    this.#server.addService(definition, wrappedHandlers);

    const uri = `${this.config.host}:${this.config.port}`;
    await this.#bindServer(uri);

    this.#setupShutdown();
  }

  /**
   *
   */
  #getServiceDefinition() {
    // Get service name from config (e.g., "agent" -> "agent")
    const serviceName = this.config.name.toLowerCase();

    const definition = definitionsExports.definitions[serviceName];
    if (!definition) {
      throw new Error(
        `Service definition for ${serviceName} not found. Available: ${Object.keys(definitionsExports.definitions).join(", ")}`,
      );
    }
    return definition;
  }

  /**
   *
   * @param handlers
   */
  #wrapHandlers(handlers) {
    const wrapped = {};
    for (const [method, handler] of Object.entries(handlers)) {
      wrapped[method] = this.#wrapUnary(handler);
    }
    return wrapped;
  }

  /**
   *
   * @param handler
   */
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

  /**
   *
   * @param uri
   */
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

  /**
   *
   */
  #setupShutdown() {
    const shutdown = () => {
      this.#logger.debug("Shutting down...");
      this.#server.tryShutdown(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}

// Export services and clients objects for runtime access
export const services = exports.services || {};
export const clients = exports.clients || {};
