/* eslint-env node */
import { common, tool } from "@copilot-ld/libtype";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { VectorClient } from "../../generated/services/vector/client.js";
import { ToolBase } from "../../generated/services/tool/service.js";

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
   * @param {common.Tool} req - Tool execution request (raw object due to generation gap)
   * @returns {Promise<common.ToolCallResult>} Tool execution result
   */
  async ExecuteTool(req) {
    // Structural dump for deep diagnostics (avoid huge logs by summarizing keys)
    try {
      const fn = req?.function || {};
      this.debug("Executing tool (inbound)", {
        keys: Object.keys(req || {}),
        fnType: typeof fn,
        fnKeys: typeof fn === "object" ? Object.keys(fn) : undefined,
        hasId: !!fn.id,
        idKeys: fn.id ? Object.keys(fn.id) : undefined,
        preview: JSON.stringify({
          id: fn.id,
          name: fn.name,
          arguments: (fn.arguments || "").slice(0, 120),
        }),
        toolId: req.id,
      });
    } catch (e) {
      // Non-fatal logging error
      void e;
    }

    try {
      // Validate request structure early
      if (!req || !req.function) {
        throw new Error("Invalid tool request: missing function");
      }
      this.debug("Raw tool request", { req: JSON.stringify(req) });
      // Extract tool name from function identifier (format: common.ToolFunction.<name>) with multiple fallbacks
      let rawName =
        (req.function && req.function.id && req.function.id.name) ||
        req.function?.name ||
        "";
      if (!rawName && typeof req.function === "object") {
        // Attempt deep search for recognizable tool names
        try {
          const json = JSON.stringify(req.function);
          const match = json.match(/sha256_hash|md5_hash|vector_search/);
          if (match) rawName = match[0];
        } catch (e) {
          void e; // ignore deep search failure
        }
      }
      // If the id object exists without name but name exists separately, synthesize id.name
      if (!req.function?.id?.name && req.function?.name) {
        req.function.id = req.function.id || {
          type: "common.ToolFunction",
          parent: "",
        };
        req.function.id.name = `common.ToolFunction.${req.function.name}`;
        rawName = req.function.id.name;
      }
      if (rawName && !rawName.includes("."))
        rawName = `common.ToolFunction.${rawName}`;
      const toolName = rawName ? rawName.split(".").pop() : "";
      this.debug("Resolved tool name", { rawName, toolName });
      if (!toolName) {
        throw new Error("Tool function name is required");
      }

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

      this.debug("Tool execution completed", { toolName, success: true });

      return {
        role: "tool",
        tool_call_id: req.id || "",
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
   * @param {string} packageName - Target package name
   * @param {string} serviceName - Target service name
   * @param {string} methodName - Target method name
   * @param {common.Tool} toolRequest - Original tool request
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
   * @param {common.Tool} toolRequest - Tool request
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
