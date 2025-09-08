/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { policyFactory } from "@copilot-ld/libpolicy";
import { common, resource } from "@copilot-ld/libtype";
import pkg from "protobufjs";
import { access } from "node:fs/promises";

const { load } = pkg;

// Use the config of the tools service
const config = await ServiceConfig.create("tool");

/**
 * Generate OpenAI-compatible JSON schema from protobuf message type
 * @param {object} messageType - Protobuf message type
 * @returns {object} JSON schema
 * @private
 */
function generateSchemaFromProtobuf(messageType) {
  const schema = {
    type: "object",
    properties: {},
    // Always include required so downstream tooling (LLM tool calling) has explicit list
    required: [],
  };

  if (!messageType || !messageType.fields) {
    return schema;
  }

  // Iterate through protobuf fields to build JSON schema
  for (const [fieldName, field] of Object.entries(messageType.fields)) {
    const property = {
      description: field.comment || `${fieldName} field`,
    };

    // Map protobuf types to JSON schema types
    switch (field.type) {
      case "string":
        property.type = "string";
        break;
      case "int32":
      case "int64":
      case "uint32":
      case "uint64":
        property.type = "integer";
        break;
      case "float":
      case "double":
        property.type = "number";
        break;
      case "bool":
        property.type = "boolean";
        break;
      default:
        // Handle repeated fields (arrays)
        if (field.rule === "repeated") {
          property.type = "array";
          if (field.type === "float" || field.type === "double") {
            property.items = { type: "number" };
          } else if (field.type === "string") {
            property.items = { type: "string" };
          } else {
            property.items = { type: "object" };
          }
        } else {
          property.type = "object";
        }
    }

    schema.properties[fieldName] = property;

    // Add to required fields if not optional. Protobufjs sets 'optional' flag only for proto2.
    // For our usage we treat absence of 'optional' AND not repeated as required.
    if (field.rule !== "repeated" && field.optional !== true) {
      schema.required.push(fieldName);
    }
  }

  return schema;
}

/**
 * Load protobuf root and extract service method schema
 * @param {string} protoPath - Path to the proto file
 * @param {string} serviceName - Service name
 * @param {string} methodName - Method name
 * @returns {Promise<object>} JSON schema for the method request
 */
async function loadMethodSchema(protoPath, serviceName, methodName) {
  const root = await load(protoPath);
  const service = root.lookupService(serviceName);
  const method = service.methods[methodName];

  if (!method) {
    throw new Error(`Method ${methodName} not found in service ${serviceName}`);
  }

  const requestType = root.lookupType(method.requestType);
  return generateSchemaFromProtobuf(requestType);
}

/**
 * Generate tool schemas from endpoint configurations
 * @param {object} endpoints - Tool endpoint configurations
 * @returns {Promise<Array<object>>} Array of tool schemas
 */
async function generateToolSchemas(endpoints) {
  const tools = [];

  for (const [toolName, endpoint] of Object.entries(endpoints)) {
    const methodParts = endpoint.method.split(".");
    if (methodParts.length < 3) {
      console.warn(
        `Invalid method format for tool ${toolName}: ${endpoint.method}`,
      );
      continue;
    }

    const [packageName, serviceName, methodName] = methodParts;

    // Resolve proto path: prefer tools/<package>.proto, fallback to proto/<package>.proto
    let protoPath = `tools/${packageName}.proto`;
    try {
      // Verify the tools-specific proto exists
      await access(protoPath);
    } catch {
      // Fallback to shared proto definition
      protoPath = `proto/${packageName}.proto`;
    }

    // Try to load schema dynamically from protobuf
    const schema = await loadMethodSchema(protoPath, serviceName, methodName);

    // Ensure schema.required exists (defensive) and if empty but properties has single key, mark it required
    if (schema && schema.properties && !Array.isArray(schema.required)) {
      schema.required = [];
    }
    if (schema && schema.properties && schema.required.length === 0) {
      for (const key of Object.keys(schema.properties)) {
        schema.required.push(key);
      }
    }

    const tool = {
      type: "function",
      function: {
        name: toolName,
        description: endpoint.description || `Execute ${toolName} tool`,
        parameters: schema,
      },
    };

    tools.push({
      endpoint,
      tool,
    });
  }

  return tools;
}

/**
 * Store tool object as a resource
 * @param {ResourceIndex} resourceIndex - Resource index instance
 * @param {object} object - Tool object
 * @param {object} endpoint - Endpoint configuration
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function storeToolResource(resourceIndex, object, endpoint, logger) {
  // Define the resource identifier
  const id = resource.Identifier.fromObject({
    name: object.function.name,
    type: "common.ToolFunction",
  });

  // Define the descriptor
  const descriptor = resource.Descriptor.fromObject({
    purpose: endpoint.purpose,
    instructions: endpoint.instructions,
    applicability: endpoint.applicability,
    evaluation: endpoint.evaluation,
  });

  // Create the resource
  const tool = common.ToolFunction.fromObject({
    id,
    descriptor,
    parameters: object.function.parameters,
  });

  logger.debug("Putting tool resource", {
    id: tool.id,
    method: endpoint.method,
  });

  // Store the resource
  await resourceIndex.put(tool);
}

/**
 * Main function to generate and store tool schemas
 * @returns {Promise<void>}
 */
async function main() {
  // No argument parsing required; all endpoints are always processed
  const resourceStorage = storageFactory("resources");
  const logger = logFactory("script.tools");
  const policy = policyFactory();

  const resourceIndex = new ResourceIndex(resourceStorage, policy);

  logger.debug("Generating tool schemas");

  const endpoints = config.endpoints || {};

  if (Object.keys(endpoints).length === 0) {
    logger.debug("No tool endpoints configured");
    return;
  }

  // Generate tool schemas
  const tools = await generateToolSchemas(endpoints);

  logger.debug("Generated tool schemas", {
    count: tools.length,
    tools: tools.map((t) => t.tool.name),
  });

  // Store each tool schema as a resource
  for (const { tool, endpoint } of tools) {
    await storeToolResource(resourceIndex, tool, endpoint, logger);
  }

  logger.debug("Tool schemas stored successfully", {
    count: tools.length,
  });
}

main().catch((error) => {
  console.error("Error generating tool schemas:", error);
  process.exit(1);
});
