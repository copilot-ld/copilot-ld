/* eslint-env node */
import { createRetry } from "@copilot-ld/libutil";

import {
  Rpc,
  createGrpc,
  createAuth,
  createObserver,
  capitalizeFirstLetter,
} from "./base.js";

/**
 * Creates a gRPC client with consistent API using pre-compiled definitions
 */
export class Client extends Rpc {
  #client;
  #retry;

  /**
   * Creates a new Client instance
   * @param {object} config - Configuration object
   * @param {object} [logger] - Optional logger instance
   * @param {import("@copilot-ld/libtelemetry").Tracer} [tracer] - Optional tracer for distributed tracing
   * @param {(serviceName: string, logger: object, tracer: object) => object} observerFn - Observer factory
   * @param {() => {grpc: object}} grpcFn - gRPC factory
   * @param {(serviceName: string) => object} authFn - Auth factory
   * @param {import("@copilot-ld/libutil").Retry} [retry] - Optional retry instance for handling transient errors
   */
  constructor(
    config,
    logger = null,
    tracer = null,
    observerFn = createObserver,
    grpcFn = createGrpc,
    authFn = createAuth,
    retry = null,
  ) {
    super(config, logger, tracer, observerFn, grpcFn, authFn);
    this.#retry = retry || createRetry({ retries: 10, delay: 1000 });
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
   * Call a gRPC method with automatic CLIENT span tracing and observability
   * @param {string} methodName - The name of the gRPC method to call
   * @param {object} request - The request object to send
   * @returns {Promise<object>} The response from the gRPC call
   */
  async callMethod(methodName, request) {
    if (!this.#client[methodName]) {
      throw new Error(`Method ${methodName} not found on gRPC client`);
    }

    // Observer handles everything: spans, events, metadata, logging
    return await this.observer().observeClientCall(
      methodName,
      request,
      async (metadata) => {
        // If no metadata provided (no tracer), create one
        const m = metadata || new (this.grpc().Metadata)();
        return await this.#callMethod(methodName, request, m);
      },
    );
  }

  /**
   * Internal call handler with retry logic
   * @param {string} methodName - The name of the method
   * @param {object} request - Request object
   * @param {object} metadata - gRPC Metadata instance
   * @returns {Promise<object>} Response object
   * @private
   */
  async #callMethod(methodName, request, metadata) {
    return await this.#retry.execute(() => {
      return new Promise((resolve, reject) => {
        this.#client[methodName](request, metadata, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
    });
  }
}
