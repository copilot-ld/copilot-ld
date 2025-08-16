#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mustache from "mustache";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parses a proto file to extract service and message definitions
 * @param {string} protoPath - Path to the proto file
 * @returns {object} Service definition with methods and messages
 */
function parseProtoFile(protoPath) {
  const content = fs.readFileSync(protoPath, "utf8");

  // Extract package name
  const packageMatch = content.match(/^\s*package\s+([a-zA-Z0-9_.]+)\s*;/m);
  const packageName = packageMatch ? packageMatch[1] : "";

  // Extract service definition
  const serviceMatch = content.match(/service\s+(\w+)\s*\{([^}]+)\}/);
  if (!serviceMatch) {
    throw new Error(`No service definition found in ${protoPath}`);
  }

  const serviceName = serviceMatch[1];
  const serviceBody = serviceMatch[2];

  // Extract RPC methods
  const rpcRegex =
    /rpc\s+(\w+)\s*\(\s*(\w+)\s*\)\s*returns\s*\(\s*(\w+)\s*\)\s*;/g;
  const methods = [];
  let methodMatch;

  while ((methodMatch = rpcRegex.exec(serviceBody)) !== null) {
    methods.push({
      name: methodMatch[1],
      requestType: methodMatch[2],
      responseType: methodMatch[3],
    });
  }

  // Extract message types
  const messageRegex = /message\s+(\w+)\s*\{[^}]*\}/g;
  const messages = [];
  let messageMatch;

  while ((messageMatch = messageRegex.exec(content)) !== null) {
    messages.push({
      name: messageMatch[1],
      fullName: packageName
        ? `${packageName}.${messageMatch[1]}`
        : messageMatch[1],
    });
  }

  return {
    packageName,
    serviceName,
    methods,
    messages,
    className: `${serviceName}Base`,
  };
}

/**
 * Mustache template for generating service base classes
 */
const serviceTemplate = `/* eslint-env node */
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

import { Interceptor, HmacAuth } from "@copilot-ld/libservice";

/**
 * Base class for {{serviceName}} service with proto-specific method stubs
 * Eliminates the need for complex dynamic schema registry
 */
export class {{className}} {
  #server;
  #started = false;
  #grpc;
  #protoLoader;
  #auth;
  #logger;

  /**
   * Creates a new {{serviceName}} service base
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
    const { grpc, protoLoader } = grpcFn ? grpcFn() : this.#defaultGrpcFactory();
    this.#grpc = grpc;
    this.#protoLoader = protoLoader;

    // Setup authentication
    this.#auth = authFn ? authFn(this.config.name) : this.#defaultAuthFactory(this.config.name);

    // Setup logging
    this.#logger = logFn ? logFn(this.config.name) : logFactory(this.config.name);
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
        \`SERVICE_AUTH_SECRET environment variable is required for service \${serviceName}\`,
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
   * Load proto definition for {{packageName}} service
   * @returns {Promise<object>} Proto definition
   */
  async loadProto() {
    const storage = storageFactory("proto", "local");
    const filename = await storage.path("{{packageName}}.proto");

    const packageDefinition = this.#grpc.loadPackageDefinition(
      this.#protoLoader.loadSync(filename, {
        keepCase: true,
        longs: String,
        enums: String,
      }),
    );

    return packageDefinition.{{packageName}};
  }

  /**
   * Start the gRPC server
   * @returns {Promise<number>} Port number the server is listening on
   */
  async start() {
    if (this.#started) throw new Error("Server is already started");

    this.#server = new this.#grpc.Server();
    const proto = await this.loadProto();
    const serviceDefinition = proto.{{serviceName}}.service;
    
    // Create handlers for all RPC methods
    const handlers = {};
{{#methods}}
    handlers.{{name}} = this.#createHandler("{{name}}");
{{/methods}}

    this.#server.addService(serviceDefinition, handlers);

    const uri = \`\${this.config.host}:\${this.config.port}\`;
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
            console.log(\`Listening on: \${uri}\`);
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
          message: \`Authentication failed: \${validation.error}\`,
        });
      }

      call.authenticatedServiceId = validation.serviceId;

      try {
        if (typeof this[methodName] !== "function") {
          throw new Error(\`Missing RPC method implementation: \${methodName}\`);
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
{{#methods}}
  /**
   * {{name}} RPC method
   * @param {object} _request - {{requestType}} message
   * @param {object} _metadata - gRPC metadata
   * @param {object} _call - gRPC call object
   * @returns {Promise<object>} {{responseType}} response
   */
  async {{name}}(_request, _metadata, _call) {
    throw new Error("{{name}} method must be implemented by subclass");
  }

{{/methods}}
}
`;

/**
 * Generate base class for a single service
 * @param {string} protoPath - Path to the proto file
 * @param {string} outputDir - Output directory for the base class
 */
function generateServiceBase(protoPath, outputDir) {
  const serviceDefinition = parseProtoFile(protoPath);
  const output = mustache.render(serviceTemplate, serviceDefinition);

  const outputPath = path.join(outputDir, "base.js");
  fs.writeFileSync(outputPath, output);

  console.log(`Generated ${serviceDefinition.className} -> ${outputPath}`);
}

/**
 * Main function to generate all service base classes
 */
async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const protoDir = path.join(projectRoot, "proto");
  const servicesDir = path.join(projectRoot, "services");

  // Get all proto files
  const protoFiles = fs
    .readdirSync(protoDir)
    .filter((file) => file.endsWith(".proto") && file !== "common.proto")
    .map((file) => path.join(protoDir, file));

  console.log("Generating service base classes...");

  for (const protoFile of protoFiles) {
    const basename = path.basename(protoFile, ".proto");
    const serviceDir = path.join(servicesDir, basename);

    if (fs.existsSync(serviceDir)) {
      generateServiceBase(protoFile, serviceDir);
    } else {
      console.warn(`Service directory not found: ${serviceDir}`);
    }
  }

  console.log("Service base class generation complete!");
  console.log("\\nNext steps:");
  console.log(
    "1. Update your service implementations to extend the generated base classes",
  );
  console.log("2. Remove the old Service class usage");
  console.log(
    "3. Add 'codegen:services': 'node tools/codegen-services.js' to package.json scripts",
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { generateServiceBase, parseProtoFile };
