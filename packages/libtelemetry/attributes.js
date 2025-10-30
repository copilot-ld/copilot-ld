/* eslint-env node */

/**
 * Metadata attribute mapping configuration
 * Maps gRPC metadata headers to span attributes with type handling
 * @typedef {object} AttributeConfig
 * @property {string} metadata - gRPC metadata header name (e.g., 'x-resource-id')
 * @property {string} telemetry - Span attribute name (e.g., 'request.resource_id')
 * @property {string} type - Type: 'string' for direct value, 'count' for array length, 'number' for numeric value
 * @property {string} protobuf - Field name in request/response object (can be nested like 'usage.total_tokens')
 */

/**
 * Standard request attributes to parse from metadata and requests
 * @type {AttributeConfig[]}
 */
export const REQUEST_ATTRIBUTE_MAP = [
  // Main conversation ID with a global namespace
  {
    metadata: "x-resource-id",
    telemetry: "resource.id",
    protobuf: "resource_id",
    type: "string",
  },

  // Tool usage
  {
    metadata: "x-request-function-name",
    telemetry: "request.function.name",
    protobuf: "function.name",
    type: "string",
  },
  {
    metadata: "x-tools",
    telemetry: "request.tools",
    protobuf: "tools",
    type: "count",
  },

  // Query
  {
    metadata: "x-request-text",
    telemetry: "request.text",
    protobuf: "text",
    type: "string",
  },
  {
    metadata: "x-request-subject",
    telemetry: "request.subject",
    protobuf: "subject",
    type: "string",
  },
  {
    metadata: "x-request-predicate",
    telemetry: "request.predicate",
    protobuf: "predicate",
    type: "string",
  },
  {
    metadata: "x-request-object",
    telemetry: "request.object",
    protobuf: "object",
    type: "string",
  },

  // Query filters
  {
    metadata: "x-request-filter-threshold",
    telemetry: "request.filter.threshold",
    protobuf: "filter.threshold",
    type: "number",
  },
  {
    metadata: "x-request-filter-limit",
    telemetry: "request.filter.limit",
    protobuf: "filter.limit",
    type: "number",
  },
  {
    metadata: "x-request-filter-max_tokens",
    telemetry: "request.filter.max_tokens",
    protobuf: "filter.max_tokens",
    type: "number",
  },

  // Other generic attributes
  {
    metadata: "x-request-identifiers",
    telemetry: "request.identifiers",
    protobuf: "identifiers",
    type: "count",
  },
  {
    metadata: "x-request-messages",
    telemetry: "request.messages",
    protobuf: "messages",
    type: "count",
  },
];

/**
 * Standard response attributes to parse from metadata and responses
 * @type {AttributeConfig[]}
 */
export const RESPONSE_ATTRIBUTE_MAP = [
  // Main conversation ID with a global namespace
  {
    metadata: "x-resource-id",
    telemetry: "resource.id",
    protobuf: "resource_id",
    type: "string",
  },

  // Tool usage
  {
    metadata: "x-response-tools",
    telemetry: "response.tools",
    protobuf: "tools",
    type: "count",
  },
  {
    metadata: "x-response-tool-call-id",
    telemetry: "response.tool_call_id",
    protobuf: "tool_call_id",
    type: "string",
  },

  // Other generic attributes
  {
    metadata: "x-response-context",
    telemetry: "response.context",
    protobuf: "context",
    type: "count",
  },
  {
    metadata: "x-response-conversation",
    telemetry: "response.conversation",
    protobuf: "conversation",
    type: "count",
  },
  {
    metadata: "x-response-identifiers",
    telemetry: "response.identifiers",
    protobuf: "identifiers",
    type: "count",
  },
  {
    metadata: "x-response-messages",
    telemetry: "response.messages",
    protobuf: "messages",
    type: "count",
  },
  {
    metadata: "x-response-usage-total-tokens",
    telemetry: "response.usage.total_tokens",
    protobuf: "usage.total_tokens",
    type: "number",
  },
];
