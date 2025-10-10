/* eslint-env node */
import yaml from "js-yaml";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { createPolicy } from "@copilot-ld/libpolicy";
import { common, resource } from "@copilot-ld/libtype";
import pkg from "protobufjs";
import { access } from "node:fs/promises";

const { Root } = pkg;

/**
 * Load tool endpoints configuration from config.json
 * @returns {Promise<object>} Tool endpoints configuration
 */
async function loadToolEndpoints() {
  const storage = createStorage("config", "local");
  const data = await storage.get("config.json");
  return data?.service?.tool?.endpoints || {};
}

/**
 * Load tool descriptors configuration from tools.yml
 * @returns {Promise<object>} Tool descriptors configuration
 */
async function loadToolDescriptors() {
  const storage = createStorage("config", "local");
  const data = await storage.get("tools.yml");
  return yaml.load(data.toString()) || {};
}

/**
 * Map protobuf field type to JSON schema property type
 * @param {object} field - Protobuf field definition
 * @returns {object} JSON schema property object
 * @private
 */
function mapFieldToSchema(field) {
  const property = {
    description: field.comment || `${field.name || "field"} field`,
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

  return property;
}

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
    // Skip github_token fields. GitHub tokens will be passed automatically
    // to the tools by the system.
    if (fieldName === "github_token") {
      continue;
    }

    const property = mapFieldToSchema(field);
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
  const root = new Root();
  await root.load(protoPath, { keepCase: true });
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
 * @param {object} logger - Logger instance
 * @returns {Promise<Array<object>>} Array of tool schemas
 */
async function generateToolSchemas(endpoints, logger) {
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

    // Mark all properties as required if none specified
    if (schema.required.length === 0) {
      schema.required = Object.keys(schema.properties);
    }

    const tool = {
      type: "function",
      function: {
        name: toolName,
        description: `Execute ${toolName} tool`,
        parameters: schema,
      },
    };

    logger.debug("Generated tool schema", { name: toolName });

    tools.push(tool);
  }

  return tools;
}

/**
 * Store tool object as a resource
 * @param {ResourceIndex} resourceIndex - Resource index instance
 * @param {object} schema - Tool schema object
 * @param {object} descriptor - Descriptor configuration
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function storeToolResource(resourceIndex, schema, descriptor, logger) {
  const tool = common.ToolFunction.fromObject({
    id: resource.Identifier.fromObject({
      name: schema.function.name,
      type: "common.ToolFunction",
    }),
    descriptor: resource.Descriptor.fromObject(descriptor),
    parameters: schema.function.parameters,
  });

  await resourceIndex.put(tool);
  logger.debug("Saved tool resource", { id: tool.id });
}

/**
 * Main function to generate and store tool schemas
 * @returns {Promise<void>}
 */
async function main() {
  const resourceIndex = new ResourceIndex(
    createStorage("resources", "local"),
    createPolicy(),
  );
  const logger = createLogger("script.tools");

  const [endpoints, descriptors] = await Promise.all([
    loadToolEndpoints(),
    loadToolDescriptors(),
  ]);

  if (Object.keys(endpoints).length === 0) {
    logger.debug("No tool endpoints configured");
    return;
  }

  const tools = await generateToolSchemas(endpoints, logger);

  // Store each tool schema as a resource, combining endpoint and descriptor data
  for (const tool of tools) {
    const name = tool.function.name;
    if (!descriptors[name]) {
      throw new Error("Missing descriptor for tool", { name });
    }
    const descriptor = descriptors[name];
    await storeToolResource(resourceIndex, tool, descriptor, logger);
  }

  logger.debug("Tool resources created successfully", { count: tools.length });
}

main();
