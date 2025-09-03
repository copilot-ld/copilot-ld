/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { policyFactory } from "@copilot-ld/libpolicy";

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
 * @param {object} _messageType - Protobuf message type
 * @returns {object} JSON schema
 * @private
 */
function _generateSchemaFromProtobuf(_messageType) {
  const schema = {
    type: "object",
    properties: {},
    required: [],
  };

  // This is a simplified schema generation
  // In a full implementation, this would introspect the protobuf types
  return schema;
}

/**
 * Generate tool schemas from endpoint configurations
 * @param {object} endpoints - Tool endpoint configurations
 * @returns {Array<object>} Array of tool schemas
 */
function generateToolSchemas(endpoints) {
  const tools = [];

  for (const [toolName, endpoint] of Object.entries(endpoints)) {
    const [serviceName, methodName] = endpoint.call.split(".");

    let schema;
    switch (`${serviceName}.${methodName}`) {
      case "vector.Vector.QueryItems":
        schema = {
          type: "object",
          properties: {
            vector: {
              type: "array",
              items: { type: "number" },
              description: "Query vector embedding",
            },
            threshold: {
              type: "number",
              description: "Similarity threshold (0-1)",
              minimum: 0,
              maximum: 1,
              default: 0.3,
            },
            limit: {
              type: "integer",
              description: "Maximum number of results",
              minimum: 1,
              default: 10,
            },
          },
          required: ["vector"],
        };
        break;

      case "toolbox.HashTools.Sha256Hash":
      case "toolbox.HashTools.Md5Hash":
        schema = {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "Input text to hash",
            },
          },
          required: ["input"],
        };
        break;

      default:
        // Generic schema for unknown tools
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
 * @param {object} logger - Logger instance
 * @returns {Promise<void>}
 */
async function storeToolResource(resourceIndex, toolName, toolSchema, logger) {
  const actor = "cld:common.System.root";

  // Create resource descriptor
  const descriptor = {
    name: toolSchema.function.name,
    description: toolSchema.function.description,
    type: "tool",
  };

  // Create resource data with tool schema
  const resourceData = {
    meta: {
      purpose: `Provides ${toolSchema.function.name} functionality`,
      instructions:
        "Use this tool when you need to perform the described operation",
      applicability: toolSchema.function.description,
      evaluation:
        "Tool execution should complete without errors and return expected results",
    },
    descriptor,
    schema: toolSchema,
    endpoints: toolName,
  };

  // Generate resource URI
  const resourceUri = `cld:common.Tool.${toolName}`;

  logger.debug("Storing tool resource", {
    toolName,
    resourceUri,
    schema: toolSchema.function.name,
  });

  // Store the resource
  await resourceIndex.put(actor, resourceUri, resourceData);
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
  const toolSchemas = generateToolSchemas(endpoints);

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
  for (const { toolName, schema } of filteredSchemas) {
    await storeToolResource(resourceIndex, toolName, schema, logger);
  }

  logger.debug("Tool schemas stored successfully", {
    count: filteredSchemas.length,
  });
}

main().catch((error) => {
  console.error("Error generating tool schemas:", error);
  process.exit(1);
});
