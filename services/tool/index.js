/* eslint-env node */
import { common, tool } from "@copilot-ld/libtype";
import { VectorClient } from "../vector/client.js";
import { ToolBase } from "./service.js";

/**
 * Tool service implementation that acts as a gRPC proxy between tool calls and actual implementations
 * @implements {ToolBase}
 */
class ToolService extends ToolBase {
  #resourceIndex;
  #clients;
  #endpoints;

  constructor(config, resourceIndex, grpcFn, authFn, logFn) {
    super(config, grpcFn, authFn, logFn);
    if (!resourceIndex) throw new Error("resourceIndex is required");

    this.#resourceIndex = resourceIndex;
    this.#clients = new Map();
    this.#endpoints = config.endpoints || {};
  }

  /**
   * Implement the `ExecuteTool` RPC.
   * @param {common.Tool} req - Tool execution request
   * @returns {Promise<common.ToolCallResult>} Tool execution result
   */
  async ExecuteTool(req) {
    this.debug("Executing tool", {
      toolName: req.function?.descriptor?.name,
      toolId: req.id,
    });

    try {
      // Extract tool name from function descriptor
      const toolName = req.function?.descriptor?.name;
      if (!toolName) {
        throw new Error("Tool function name is required");
      }

      // Look up endpoint configuration
      const endpoint = this.#endpoints[toolName];
      if (!endpoint) {
        throw new Error(`Tool endpoint not found: ${toolName}`);
      }

      // Parse the endpoint call configuration
      const [serviceName, methodName] = endpoint.call.split(".");
      if (!serviceName || !methodName) {
        throw new Error(`Invalid endpoint call format: ${endpoint.call}`);
      }

      // Route to appropriate service
      const result = await this.#routeToService(serviceName, methodName, req);

      this.debug("Tool execution completed", {
        toolName,
        success: true,
      });

      return {
        role: "tool",
        tool_call_id: req.id || "",
        content: JSON.stringify(result),
      };
    } catch (error) {
      this.debug("Tool execution failed", {
        toolName: req.function?.descriptor?.name,
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
   * Implement the `ListTools` RPC.
   * @param {tool.ListToolsRequest} req - List tools request
   * @returns {Promise<tool.ListToolsResponse>} Available tools
   */
  async ListTools(req) {
    this.debug("Listing available tools", {
      namespace: req.namespace,
    });

    try {
      const actor = "cld:common.System.root";
      const tools = [];

      // Load tools from ResourceIndex
      this.debug("Loading tools from ResourceIndex", {
        available: !!this.#resourceIndex,
      });

      // Query ResourceIndex for ToolFunction resources
      // For now, we'll implement a simple pattern-based query
      // In a full implementation, this would use proper resource querying
      const resourcePattern = "cld:common.ToolFunction.";

      // Since ResourceIndex doesn't have a query method, we'll iterate through known tools
      // This would be improved with a proper query interface
      for (const [toolName] of Object.entries(this.#endpoints)) {
        // Skip if namespace filter doesn't match
        if (req.namespace && !toolName.startsWith(req.namespace)) {
          continue;
        }

        try {
          const resourceId = `${resourcePattern}${toolName}`;
          const toolResource = await this.#resourceIndex.get(actor, resourceId);

          if (toolResource && toolResource.toolSchema) {
            tools.push(toolResource.toolSchema);
          }
        } catch (error) {
          this.debug("Failed to load tool from ResourceIndex", {
            toolName,
            error: error.message,
          });
          // Continue with next tool instead of failing completely
        }
      }

      this.debug("Tools listed from ResourceIndex", { count: tools.length });

      return { tools };
    } catch (error) {
      this.debug("Failed to list tools", { error: error.message });
      return { tools: [] };
    }
  }

  /**
   * Route tool call to appropriate service
   * @param {string} serviceName - Target service name
   * @param {string} methodName - Target method name
   * @param {common.Tool} toolRequest - Original tool request
   * @returns {Promise<object>} Service response
   * @private
   */
  async #routeToService(serviceName, methodName, toolRequest) {
    const serviceKey = `${serviceName}.${methodName}`;

    // Get or create gRPC client for service
    let client = this.#clients.get(serviceKey);
    if (!client) {
      client = await this.#createServiceClient(serviceName);
      this.#clients.set(serviceKey, client);
    }

    // Convert tool arguments to service request format
    const serviceRequest = await this.#convertToolToServiceRequest(
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
   * @param {string} serviceName - Service name
   * @returns {Promise<object>} Service client
   * @private
   */
  async #createServiceClient(serviceName) {
    // For now, support only vector service as example
    // In full implementation, this would dynamically create clients based on serviceName
    switch (serviceName.toLowerCase()) {
      case "vector":
        return new VectorClient(this.config);
      default:
        throw new Error(`Unsupported service: ${serviceName}`);
    }
  }

  /**
   * Convert tool request to service-specific request format
   * @param {string} serviceName - Target service name
   * @param {string} methodName - Target method name
   * @param {common.Tool} toolRequest - Tool request
   * @returns {Promise<object>} Service request
   * @private
   */
  async #convertToolToServiceRequest(serviceName, methodName, toolRequest) {
    // Parse tool arguments
    const args = toolRequest.function?.arguments
      ? JSON.parse(toolRequest.function.arguments)
      : {};

    // Convert based on service and method
    switch (`${serviceName}.${methodName}`) {
      case "vector.QueryItems":
        return {
          vector: args.embedding || args.vector,
          filter: {
            threshold: args.threshold || 0.3,
            limit: args.limit || 10,
          },
        };
      default:
        // For custom services, pass arguments directly
        return args;
    }
  }
}

export { ToolService };
export { ToolClient } from "./client.js";
