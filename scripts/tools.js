#!/usr/bin/env node
import yaml from "js-yaml";
import pkg from "protobufjs";
import { access } from "node:fs/promises";

import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";
import { resource, tool } from "@copilot-ld/libtype";

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

  // Handle repeated fields (arrays) first, before scalar type mapping
  if (field.rule === "repeated") {
    property.type = "array";
    switch (field.type) {
      case "string":
        property.items = { type: "string" };
        break;
      case "int32":
      case "int64":
      case "uint32":
      case "uint64":
        property.items = { type: "integer" };
        break;
      case "float":
      case "double":
        property.items = { type: "number" };
        break;
      case "bool":
        property.items = { type: "boolean" };
        break;
      default:
        property.items = { type: "object" };
    }
    return property;
  }

  // Map scalar protobuf types to JSON schema types
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
      property.type = "object";
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
    // Skip the filter and llm_token fields. These will be automatically
    // passed by the system.
    if (fieldName === "llm_token" || fieldName === "filter") {
      continue;
    }

    const property = mapFieldToSchema(field);
    schema.properties[fieldName] = property;

    // Add to required fields if not optional. Protobufjs sets 'optional' flag only for proto2.
    // For our usage we treat absence of 'optional' AND not repeated as required.
    if (field.rule !== "repeated" && !field.optional) {
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
    const fullServiceName = `${packageName}.${serviceName}`;

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
    const schema = await loadMethodSchema(
      protoPath,
      fullServiceName,
      methodName,
    );

    // Mark all properties as required if none specified
    // Exception: if all fields are optional, keep required array empty
    if (
      schema.required.length === 0 &&
      Object.keys(schema.properties).length > 0
    ) {
      // For tools with only optional parameters, leave required array empty
      // This is valid for OpenAI function calling
    } else if (schema.required.length === 0) {
      schema.required = Object.keys(schema.properties);
    }

    // Ensure parameters object is valid for OpenAI function calling
    // OpenAI requires at least properties and required fields, even if empty
    if (!schema.properties) {
      schema.properties = {};
    }
    if (!schema.required) {
      schema.required = [];
    }

    const tool = {
      type: "function",
      function: {
        name: toolName,
        description: `Execute ${toolName} tool`,
        parameters: schema,
      },
    };

    logger.debug("Processor", "Generated tool schema", { name: toolName });

    tools.push(tool);
  }

  return tools;
}

/**
 * Build tool description from descriptor fields
 * @param {object} descriptor - Descriptor with purpose, applicability, instructions, evaluation
 * @returns {string} Formatted description string
 */
function buildToolDescription(descriptor) {
  const parts = [];

  if (descriptor.purpose) {
    parts.push(`PURPOSE: ${descriptor.purpose.trim()}`);
  }
  if (descriptor.applicability) {
    parts.push(`WHEN TO USE: ${descriptor.applicability.trim()}`);
  }
  if (descriptor.instructions) {
    parts.push(`HOW TO USE: ${descriptor.instructions.trim()}`);
  }
  if (descriptor.evaluation) {
    parts.push(`RETURNS: ${descriptor.evaluation.trim()}`);
  }

  return parts.join("\n\n") || "No description available";
}

/**
 * Store tool object as a resource
 * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index instance
 * @param {object} schema - Tool schema object
 * @param {object} descriptor - Descriptor configuration
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function storeToolResource(resourceIndex, schema, descriptor, logger) {
  // Convert OpenAI function parameters to ToolParam protobuf format
  const parameters = schema.function.parameters;
  const toolParam = {
    type: parameters.type || "object",
    properties: parameters.properties || {},
    required: parameters.required || [],
  };

  // Ensure empty schemas are valid for OpenAI by adding required fields explicitly
  // For tools with no parameters, we still need valid JSON schema structure
  if (
    Object.keys(toolParam.properties).length === 0 &&
    toolParam.required.length === 0
  ) {
    // OpenAI requires properties and required fields to be present, even if empty
    // We ensure they're included by adding them explicitly to the protobuf structure
    toolParam.properties = {};
    toolParam.required = [];
  }

  // Force required field to be included even if empty for OpenAI compatibility
  if (!Object.prototype.hasOwnProperty.call(toolParam, "required")) {
    toolParam.required = [];
  }

  // Build description from descriptor fields (purpose, applicability, instructions, evaluation)
  const description = buildToolDescription(descriptor);

  const func = tool.ToolFunction.fromObject({
    id: resource.Identifier.fromObject({
      name: schema.function.name,
      type: "tool.ToolFunction",
    }),
    name: schema.function.name,
    description,
    parameters: toolParam,
  });

  await resourceIndex.put(func);
  logger.debug("Processor", "Saved tool resource", { id: func.id });
}

/**
 * Main function to generate and store tool schemas
 * @returns {Promise<void>}
 */
async function main() {
  const resourceIndex = createResourceIndex("resources");
  const logger = createLogger("tools");

  const [endpoints, descriptors] = await Promise.all([
    loadToolEndpoints(),
    loadToolDescriptors(),
  ]);

  if (Object.keys(endpoints).length === 0) {
    logger.debug("Processor", "No tool endpoints configured");
    return;
  }

  const tools = await generateToolSchemas(endpoints, logger);

  // Build lookup map from descriptors object
  const descriptorMap = new Map(
    Object.entries(descriptors).map(([name, desc]) => [name, desc]),
  );

  // Store each tool schema as a resource, combining endpoint and descriptor data
  for (const tool of tools) {
    const name = tool.function.name;
    if (!descriptorMap.has(name)) {
      throw new Error("Missing descriptor for tool", { name });
    }
    const descriptor = descriptorMap.get(name);
    await storeToolResource(resourceIndex, tool, descriptor, logger);
  }

  logger.debug("Processor", "Tool resources created successfully", {
    count: tools.length,
  });
}

main();
