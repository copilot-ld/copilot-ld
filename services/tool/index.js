/* eslint-env node */
import { createServiceConfig } from "@copilot-ld/libconfig";
import * as types from "@copilot-ld/libtype";

import { services, clients } from "@copilot-ld/librpc";

const { ToolBase } = services;

/**
 * Tool service implementation that acts as a gRPC proxy between tool calls and actual implementations
 * @implements {ToolBase}
 */
export class ToolService extends ToolBase {
  #clients;
  #endpoints;

  /**
   * Creates a new Tool service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory function
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
   * Makes a tool call by routing to the appropriate service
   * @param {import("@copilot-ld/libtype").tool.ToolDefinition} req - Tool execution request
   */
  async CallTool(req) {
    try {
      if (!req?.id || !req?.function) {
        throw new Error("Invalid tool request: missing id or function");
      }

      const toolName = req.function.id.name;

      const endpoint = this.#endpoints[toolName];
      if (!endpoint) {
        throw new Error(`Tool endpoint not found: ${toolName}`);
      }

      const methodParts = endpoint.method.split(".");
      if (methodParts.length !== 3) {
        throw new Error(`Invalid endpoint method format: ${endpoint.method}`);
      }
      const [servicePackage, serviceName, serviceMethod] = methodParts;

      const requestParts = endpoint.request.split(".");
      if (requestParts.length !== 2) {
        throw new Error(`Invalid endpoint request format: ${endpoint.request}`);
      }
      const [requestPackage, requestType] = requestParts;

      // Route to the appropriate service and pass-on the tool call result
      return await this.#routeToService(
        servicePackage,
        serviceName,
        serviceMethod,
        requestPackage,
        requestType,
        req,
      );
    } catch (error) {
      return {
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

    if (!clients[clientClassName]) {
      throw new Error(`Client class not found: ${clientClassName}`);
    }

    const ClientClass = clients[clientClassName];
    return new ClientClass(await createServiceConfig(servicePackage));
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

    if (toolRequest.filter) args.filter = toolRequest.filter;
    if (toolRequest.github_token) args.github_token = toolRequest.github_token;

    const RequestType = types[requestPackage]?.[requestType];
    if (!RequestType) {
      throw new Error(
        `Request type not found: ${requestPackage}.${requestType}`,
      );
    }

    return RequestType.fromObject(args);
  }
}
