/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { policyFactory } from "@copilot-ld/libpolicy";
import pkg from "protobufjs";

const { load } = pkg;

const config = await ScriptConfig.create("tools");

/**
 * Parse command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    namespace: null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--namespace" && i + 1 < args.length) {
      parsed.namespace = args[i + 1];
      i++; // skip the next argument as it's the value
    } else if (args[i] === "--dry-run") {
      parsed.dryRun = true;
    }
  }

  return parsed;
}

/**
 * Generate OpenAI-compatible JSON schema from protobuf message type
 * @param {object} messageType - Protobuf message type
 * @returns {object} JSON schema
 * @private
 */
function _generateSchemaFromProtobuf(messageType) {
  const schema = {
    type: "object",
    properties: {},
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

    // Add to required fields if not optional
    if (field.rule === "required" || (!field.rule && !field.optional)) {
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
async function _loadMethodSchema(protoPath, serviceName, methodName) {
  try {
    const root = await load(protoPath);
    const service = root.lookupService(serviceName);
    const method = service.methods[methodName];
    
    if (!method) {
      throw new Error(`Method ${methodName} not found in service ${serviceName}`);
    }

    const requestType = root.lookupType(method.requestType);
    return _generateSchemaFromProtobuf(requestType);
  } catch (error) {
    console.warn(`Failed to load schema for ${serviceName}.${methodName}:`, error.message);
    // Return a generic schema as fallback
    return {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Input data for the tool",
        },
      },
      required: ["input"],
    };
  }
}

/**
 * Generate tool schemas from endpoint configurations
 * @param {object} endpoints - Tool endpoint configurations
 * @returns {Promise<Array<object>>} Array of tool schemas
 */
async function generateToolSchemas(endpoints) {
  const tools = [];

  for (const [toolName, endpoint] of Object.entries(endpoints)) {
    const callParts = endpoint.call.split(".");
    if (callParts.length < 3) {
      console.warn(`Invalid call format for tool ${toolName}: ${endpoint.call}`);
      continue;
    }

    const [packageName, serviceName, methodName] = callParts;
    const protoPath = `proto/${packageName}.proto`;

    // Try to load schema dynamically from protobuf
    let schema;
    try {
      schema = await _loadMethodSchema(protoPath, serviceName, methodName);
    } catch (error) {
      console.warn(`Failed to generate schema for ${toolName}:`, error.message);
      // Fallback to generic schema
      schema = {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "Input data for the tool",
          },
        },
        required: ["input"],
      };
    }

    const tool = {
      type: "function",
      function: {
        name: endpoint.name || toolName,
        description: endpoint.description || `Execute ${toolName} tool`,
        parameters: schema,
      },
    };

    tools.push({
      toolName,
      endpoint,
      schema: tool,
    });
  }

  return tools;
}

/**
 * Store tool schema as a resource
 * @param {ResourceIndex} resourceIndex - Resource index instance
 * @param {string} toolName - Tool name
 * @param {object} toolSchema - Tool schema
 * @param {object} endpoint - Endpoint configuration
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function storeToolResource(resourceIndex, toolName, toolSchema, endpoint, logger) {
  const actor = "cld:common.System.root";

  // Create resource identifier
  const resourceId = `cld:common.ToolFunction.${toolName}`;

  // Create resource descriptor
  const descriptor = {
    name: toolSchema.function.name,
    description: toolSchema.function.description,
    type: "ToolFunction",
  };

  // Get meta fields from endpoint configuration or use defaults
  const meta = {
    purpose: endpoint.purpose || `Provides ${toolSchema.function.name} functionality`,
    instructions: endpoint.instructions || "Use this tool when you need to perform the described operation",
    applicability: endpoint.applicability || toolSchema.function.description,
    evaluation: endpoint.evaluation || "Tool execution should complete without errors and return expected results",
  };

  // Create ToolFunction resource following the pattern used by MessageV2
  const toolFunction = {
    id: { uri: resourceId },
    descriptor,
    parameters: toolSchema.function.parameters,
  };

  // Create resource content
  const resourceContent = {
    id: { uri: resourceId },
    descriptor,
    content: {
      meta,
      data: JSON.stringify(toolFunction),
      mime_type: "application/json",
    },
    toolSchema,
    endpoint: endpoint.call,
  };

  logger.debug("Storing tool resource", {
    toolName,
    resourceId,
    schema: toolSchema.function.name,
    call: endpoint.call,
  });

  // Store the resource
  await resourceIndex.put(actor, resourceId, resourceContent);
}

/**
 * Main function to generate and store tool schemas
 * @returns {Promise<void>}
 */
async function main() {
  const args = parseArgs();
  const resourceStorage = storageFactory("resources");
  const logger = logFactory("script.tools");
  const policy = policyFactory();

  const resourceIndex = new ResourceIndex(resourceStorage, policy);

  logger.debug("Generating tool schemas", {
    namespace: args.namespace,
    dryRun: args.dryRun,
  });

  // Get tool endpoints from configuration
  const toolConfig = (await config.get("service.tool")) || {};
  const endpoints = toolConfig.endpoints || {};

  if (Object.keys(endpoints).length === 0) {
    logger.debug("No tool endpoints configured");
    return;
  }

  // Generate tool schemas
  const toolSchemas = await generateToolSchemas(endpoints);

  logger.debug("Generated tool schemas", {
    count: toolSchemas.length,
    tools: toolSchemas.map((t) => t.toolName),
  });

  // Filter by namespace if specified
  const filteredSchemas = args.namespace
    ? toolSchemas.filter((t) => t.toolName.startsWith(args.namespace))
    : toolSchemas;

  if (args.dryRun) {
    logger.debug("Dry run - would store schemas", {
      schemas: filteredSchemas.map((t) => ({
        toolName: t.toolName,
        name: t.schema.function.name,
        description: t.schema.function.description,
      })),
    });
    return;
  }

  // Store each tool schema as a resource
  for (const { toolName, schema, endpoint } of filteredSchemas) {
    await storeToolResource(resourceIndex, toolName, schema, endpoint, logger);
  }

  logger.debug("Tool schemas stored successfully", {
    count: filteredSchemas.length,
  });
}

main().catch((error) => {
  console.error("Error generating tool schemas:", error);
  process.exit(1);
});
