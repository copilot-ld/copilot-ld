/* eslint-env node */
import protoLoader from "@grpc/proto-loader";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { logFactory } from "@copilot-ld/libutil";

import { grpcFactory, authFactory } from "./base.js";
import * as exports from "./generated/services/exports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { grpcFactory, authFactory, Rpc, Client } from "./base.js";
export { Interceptor, HmacAuth } from "./auth.js";
export { RpcInterface, ClientInterface } from "./types.js";

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
    const protoPath = join(__dirname, "generated", "proto", protoName);

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

// Export services and clients objects for runtime access
export const services = exports.services || {};
export const clients = exports.clients || {};
