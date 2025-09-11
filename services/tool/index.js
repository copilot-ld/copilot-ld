/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { VectorClient } from "../../generated/services/vector/client.js";
import { ToolBase } from "../../generated/services/tool/service.js";

/**
 * Tool service implementation that acts as a gRPC proxy between tool calls and actual implementations
 * @implements {ToolBase}
 */
class ToolService extends ToolBase {
  #clients;
  #endpoints;

  /**
   * Creates a new Tool service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration object
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, logFn) {
    super(config, logFn);
    this.#clients = new Map();
    this.#endpoints = config.endpoints || {};
  }

  /**
   * Gets the configured endpoints
   * @returns {object} The endpoints configuration
   */
  get endpoints() {
    return this.#endpoints;
  }

  /**
   * Implement the `ExecuteTool` RPC.
   * @param {object} req - Tool execution request (raw object due to generation gap)
   * @returns {Promise<import("@copilot-ld/libtype").common.ToolCallResult>} Tool execution result
   */
  async ExecuteTool(req) {
    try {
      // Validate request structure early
      if (!req?.id || !req?.function) {
        throw new Error("Invalid tool request: missing id or function");
      }

      const toolName = req.function.id.name;
      this.debug("Executing tool", { name: toolName });

      // Look up endpoint configuration
      const endpoint = this.#endpoints[toolName];
      if (!endpoint) {
        throw new Error(`Tool endpoint not found: ${toolName}`);
      }

      // Parse the endpoint method configuration
      const methodParts = endpoint.method.split(".");
      if (methodParts.length !== 3) {
        throw new Error(`Invalid endpoint method format: ${endpoint.method}`);
      }
      const [packageName, serviceName, methodName] = methodParts;

      // Route to appropriate service
      const result = await this.#routeToService(
        packageName,
        serviceName,
        methodName,
        req,
      );

      return {
        role: "tool",
        tool_call_id: req.id,
        content: JSON.stringify(result),
      };
    } catch (error) {
      this.debug("Tool execution failed", {
        toolName: req.function?.name,
        error: error.message,
      });

      return {
        role: "tool",
        tool_call_id: req.id || "",
        content: JSON.stringify({ error: error.message }),
      };
    }
  }

  /**
   * Route tool call to appropriate service
   * @param {string} packageName - Target package name
   * @param {string} serviceName - Target service name
   * @param {string} methodName - Target method name
   * @param {object} toolRequest - Original tool request
   * @returns {Promise<object>} Service response
   * @private
   */
  async #routeToService(packageName, serviceName, methodName, toolRequest) {
    const serviceKey = `${packageName}.${serviceName}.${methodName}`;

    // Get or create gRPC client for service
    let client = this.#clients.get(serviceKey);

    if (!client) {
      client = await this.#createServiceClient(packageName, serviceName);
      this.#clients.set(serviceKey, client);
    }

    // Convert tool arguments to service request format
    const serviceRequest = await this.#convertToolToServiceRequest(
      packageName,
      serviceName,
      methodName,
      toolRequest,
    );

    // Execute service call
    const response = await client[methodName](serviceRequest);

    return response;
  }

  /**
   * Create gRPC client for a service
   * @param {string} packageName - Package name
   * @param {string} serviceName - Service name
   * @returns {Promise<object>} Service client
   * @private
   */
  async #createServiceClient(packageName, serviceName) {
    // Support different service types based on package and service name
    switch (`${packageName}.${serviceName}`) {
      case "vector.Vector":
        return new VectorClient(await ServiceConfig.create("vector"));
      case "hash.Hash": {
        const { HashClient } = await import(
          "../../generated/tools/hash/client.js"
        );
        return new HashClient(await ServiceConfig.create("hash"));
      }
      default:
        throw new Error(`Unsupported service: ${packageName}.${serviceName}`);
    }
  }

  /**
   * Convert tool request to service-specific request format
   * @param {string} packageName - Target package name
   * @param {string} serviceName - Target service name
   * @param {string} methodName - Target method name
   * @param {object} toolRequest - Tool request
   * @returns {Promise<object>} Service request
   * @private
   */
  async #convertToolToServiceRequest(
    packageName,
    serviceName,
    methodName,
    toolRequest,
  ) {
    // Parse tool arguments
    const argsRaw =
      toolRequest.function?.arguments ||
      toolRequest.function?.parameters?.arguments;
    let args = {};
    if (argsRaw) {
      try {
        args = JSON.parse(argsRaw);
      } catch (e) {
        this.debug("Arguments JSON parse failed", {
          error: e.message,
          argsSample: argsRaw.slice(0, 120),
        });
        args = { _parseError: e.message };
      }
    }

    // Convert based on package, service and method
    switch (`${packageName}.${serviceName}.${methodName}`) {
      case "vector.Vector.QueryItems":
        return {
          vector: args.embedding || args.vector,
          filter: {
            threshold: args.threshold || 0.3,
            limit: args.limit || 10,
          },
        };
      case "hash.Hash.Sha256":
      case "hash.Hash.Md5":
        return {
          input: args.input || args.text || "",
        };
      default:
        // For other services, pass arguments directly
        return args;
    }
  }
}

export { ToolService };
export { ToolClient } from "../../generated/services/tool/client.js";
