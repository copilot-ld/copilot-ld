/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import * as types from "@copilot-ld/libtype";

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
      const [servicePackage, serviceName, serviceMethod] = methodParts;

      // Parse the request type configuration
      const requestParts = endpoint.request.split(".");
      if (requestParts.length !== 2) {
        throw new Error(`Invalid endpoint request format: ${endpoint.request}`);
      }
      const [requestPackage, requestType] = requestParts;

      // Route to appropriate service
      const result = await this.#routeToService(
        servicePackage,
        serviceName,
        serviceMethod,
        requestPackage,
        requestType,
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
   * @param {string} servicePackage - Target service package name
   * @param {string} serviceName - Target service name
   * @param {string} serviceMethod - Target service method name
   * @param {string} requestPackage - Request type package name
   * @param {string} requestType - Request type name
   * @param {object} toolRequest - Original tool request
   * @returns {Promise<object>} Service response
   * @private
   */
  async #routeToService(
    servicePackage,
    serviceName,
    serviceMethod,
    requestPackage,
    requestType,
    toolRequest,
  ) {
    const serviceKey = `${servicePackage}.${serviceName}.${serviceMethod}`;

    let client = this.#clients.get(serviceKey);

    if (!client) {
      client = await this.#createServiceClient(servicePackage, serviceName);
      this.#clients.set(serviceKey, client);
    }

    const serviceRequest = await this.#createServiceRequest(
      requestPackage,
      requestType,
      toolRequest,
    );

    const response = await client[serviceMethod](serviceRequest);

    return response;
  }

  /**
   * Create gRPC client for a service
   * @param {string} servicePackage - Service package name
   * @param {string} serviceName - Service name
   * @returns {Promise<object>} Service client
   * @private
   */
  async #createServiceClient(servicePackage, serviceName) {
    const clientClassName = `${serviceName}Client`;
    const clientModule = await import(
      `../../generated/services/${servicePackage}/client.js`
    );

    if (!clientModule[clientClassName])
      throw new Error(`Client class not found: ${clientClassName}`);

    const ClientClass = clientModule[clientClassName];
    return new ClientClass(await ServiceConfig.create(servicePackage));
  }

  /**
   * Create the request for a service method
   * @param {string} requestPackage - Request type package name
   * @param {string} requestType - Request type name
   * @param {object} toolRequest - Tool request
   * @returns {Promise<object>} Service request
   * @private
   */
  async #createServiceRequest(requestPackage, requestType, toolRequest) {
    if (!toolRequest.function?.arguments)
      throw new Error("Missing function arguments");

    const args = JSON.parse(toolRequest.function.arguments);

    // Pass-on github_token if present
    if (toolRequest.github_token) {
      args.github_token = toolRequest.github_token;
    }

    // Get the request type from the types object
    const RequestType = types[requestPackage]?.[requestType];
    if (!RequestType) {
      throw new Error(
        `Request type not found: ${requestPackage}.${requestType}`,
      );
    }

    // Use fromObject to create the properly typed request
    return RequestType.fromObject(args);
  }
}

export { ToolService };
export { ToolClient } from "../../generated/services/tool/client.js";
