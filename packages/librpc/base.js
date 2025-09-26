/* eslint-env node */
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { Interceptor, HmacAuth } from "./auth.js";
import { RpcInterface, ClientInterface } from "./types.js";
import { logFactory } from "@copilot-ld/libutil";
import { storageFactory } from "@copilot-ld/libstorage";

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
        this.config.host === "0.0.0.0" ? this.config.name : this.config.host;

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
          this.debug(`gRPC call failed: ${methodName}`, { error });
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}
