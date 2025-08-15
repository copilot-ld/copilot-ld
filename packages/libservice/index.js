/* eslint-env node */
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { create } from "@bufbuild/protobuf";

import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

import { Interceptor, HmacAuth } from "./auth.js";
import { ClientInterface, ServiceInterface, ActorInterface } from "./types.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically imports all generated proto schema modules
 * @returns {Promise<object>} Schema registry mapping type names to schemas
 */
async function createDynamicSchemaRegistry() {
  const generatedDir = path.resolve(__dirname, "../../generated");

  // Check if generated directory exists
  if (!fs.existsSync(generatedDir)) {
    console.warn(
      "Generated proto directory not found. Schema registry will be empty.",
    );
    return {};
  }

  const registry = {};
  const files = fs
    .readdirSync(generatedDir)
    .filter((file) => file.endsWith("_pb.js"));

  for (const file of files) {
    try {
      const modulePath = path.join(generatedDir, file);
      const module = await import(modulePath);

      // Extract schemas from the module using the same pattern as manual approach
      for (const [exportName, schema] of Object.entries(module)) {
        if (exportName.endsWith("Schema") && schema?.typeName) {
          registry[schema.typeName] = schema;
        }
      }
    } catch (error) {
      console.warn(`Failed to import schema module ${file}:`, error.message);
    }
  }

  return registry;
}

/**
 * Alternative approach: Parse proto files directly to extract type information
 * This completely eliminates dependency on generated files for the registry
 * @returns {Promise<object>} Schema registry built from proto file analysis
 */
async function createProtoBasedSchemaRegistry() {
  const protoDir = path.resolve(__dirname, "../../proto");

  if (!fs.existsSync(protoDir)) {
    console.warn("Proto directory not found.");
    return {};
  }

  const registry = {};
  const protoFiles = fs
    .readdirSync(protoDir)
    .filter((file) => file.endsWith(".proto"));

  for (const file of protoFiles) {
    try {
      const protoPath = path.join(protoDir, file);
      const content = fs.readFileSync(protoPath, "utf8");

      // Extract package name
      const packageMatch = content.match(/^\s*package\s+([a-zA-Z0-9_.]+)\s*;/m);
      const packageName = packageMatch ? packageMatch[1] : "";

      // Extract message definitions
      const messageRegex = /^\s*message\s+([a-zA-Z0-9_]+)\s*\{/gm;
      let match;

      while ((match = messageRegex.exec(content)) !== null) {
        const messageName = match[1];
        const fullTypeName = packageName
          ? `${packageName}.${messageName}`
          : messageName;

        // Store type information - in a real implementation, this would
        // need to dynamically import or reference the actual schema
        registry[fullTypeName] = {
          typeName: fullTypeName,
          packageName,
          messageName,
          protoFile: file,
        };
      }
    } catch (error) {
      console.warn(`Failed to parse proto file ${file}:`, error.message);
    }
  }

  return registry;
}
/**
 * Schema registry - will be populated dynamically at runtime
 * This approach eliminates the need for manual maintenance
 */
let SCHEMA_REGISTRY = {};

/**
 * Initializes the schema registry using multiple dynamic strategies
 * @returns {Promise<void>}
 */
async function initializeSchemaRegistry() {
  try {
    // Strategy 1: Load from generated files (preferred)
    SCHEMA_REGISTRY = await createDynamicSchemaRegistry();

    if (Object.keys(SCHEMA_REGISTRY).length > 0) {
      console.log(
        `Loaded ${Object.keys(SCHEMA_REGISTRY).length} proto schemas from generated files`,
      );
      return;
    }

    // Strategy 2: Parse proto files directly (fallback)
    console.log(
      "Generated files not available, parsing proto files directly...",
    );
    const protoBasedRegistry = await createProtoBasedSchemaRegistry();
    console.log(
      `Discovered ${Object.keys(protoBasedRegistry).length} proto types from source files`,
    );

    // Note: In a complete implementation, you would need to resolve the
    // actual schema objects for the proto-based approach
  } catch (error) {
    console.warn("Failed to initialize schema registry:", error.message);
    console.warn("Proto typing features will be unavailable.");
  }
}

// Initialize the registry
await initializeSchemaRegistry();

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
 * Converts a POJO message to a typed message object using bufbuild schemas
 * @param {object} pojo - Plain old JavaScript object from grpc
 * @param {string} typeName - The proto type name (e.g., "common.Message")
 * @returns {object} Typed message object with $typeName property
 */
export function createTypedMessage(pojo, typeName) {
  const schema = SCHEMA_REGISTRY[typeName];
  if (!schema) {
    // Return original object with $typeName if schema not found
    return { ...pojo, $typeName: typeName };
  }

  return create(schema, pojo);
}

/**
 * Recursively converts POJOs to typed messages in a response object
 * @param {object} response - gRPC response object
 * @param {string} rootTypeName - The root message type name
 * @returns {object} Response with typed message objects
 */
export function convertResponseToTyped(response, rootTypeName) {
  if (!response || typeof response !== "object") {
    return response;
  }

  // Convert arrays
  if (Array.isArray(response)) {
    return response.map((item) => convertResponseToTyped(item, rootTypeName));
  }

  // Create typed version of the response
  const typedResponse = createTypedMessage(response, rootTypeName);

  // Recursively convert nested objects
  for (const [key, value] of Object.entries(typedResponse)) {
    if (value && typeof value === "object") {
      // Try to infer type name for nested objects
      const nestedTypeName = inferNestedTypeName(key, rootTypeName);
      if (nestedTypeName) {
        typedResponse[key] = convertResponseToTyped(value, nestedTypeName);
      }
    }
  }

  return typedResponse;
}

/**
 * Infer nested type name based on field name and parent type
 * @param {string} fieldName - The field name
 * @param {string} _parentType - The parent message type (unused)
 * @returns {string|null} Inferred type name or null
 */
function inferNestedTypeName(fieldName, _parentType) {
  // Common patterns for nested types
  const typeMap = {
    message: "common.Message",
    messages: "common.Message",
    usage: "common.Usage",
    choices: "common.Choice",
    choice: "common.Choice",
    chunks: "common.Chunk",
    chunk: "common.Chunk",
    similarities: "common.Similarity",
    results: "common.Similarity",
    embeddings: "common.Embedding",
    embedding: "common.Embedding",
  };

  return typeMap[fieldName] || null;
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
  debug = (message, context) => this.#logger.debug(message, context);

  /** @inheritdoc */
  async loadProto(serviceName) {
    const storage = storageFactory("proto", "local");
    const filename = await storage.path(`${serviceName}.proto`);

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
          if (error) {
            reject(error);
          } else {
            // Convert POJO response to typed message object
            const responseTypeName = this.#getResponseTypeName(method);
            const typedResponse = responseTypeName
              ? convertResponseToTyped(response, responseTypeName)
              : response;
            resolve(typedResponse);
          }
        });
      });
    };
  }

  /**
   * Gets the response type name for a given method
   * @param {string} method - Method name
   * @returns {string|null} Response type name
   * @private
   */
  #getResponseTypeName(method) {
    const serviceMethod = method.toLowerCase();
    const serviceName = this.config.name.toLowerCase();

    // Map service methods to their response types
    const responseTypeMap = {
      "agent.processrequest": "agent.AgentResponse",
      "vector.queryitems": "vector.QueryItemsResponse",
      "history.gethistory": "history.GetHistoryResponse",
      "history.updatehistory": "history.UpdateHistoryResponse",
      "text.getchunks": "text.GetChunksResponse",
      "llm.createcompletions": "llm.CreateCompletionsResponse",
      "llm.createembeddings": "llm.CreateEmbeddingsResponse",
    };

    const key = `${serviceName}.${serviceMethod}`;
    return responseTypeMap[key] || null;
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
  constructor(
    config,
    grpcFn = grpcFactory,
    authFn = authFactory,
    logFn = logFactory,
  ) {
    super(config, grpcFn, authFn, logFn);
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

export {
  ActorInterface,
  ClientInterface,
  ServiceInterface,
  HmacAuth,
  Interceptor,
};
