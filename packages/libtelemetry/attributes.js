/* eslint-env node */

/**
 * Telemetry attribute mapping configuration
 * Maps protobuf fields to span attributes with type handling
 * @typedef {object} AttributeConfig
 * @property {string} key - Field name in request/response object (can be nested like 'usage.total_tokens')
 * @property {string} type - Type: 'string' for direct value, 'count' for array length, 'number' for numeric value
 */

/**
 * Standard telemetry attributes to parse from requests and responses
 * Span attributes are automatically prefixed with "request." or "response."
 * except for "resource_id" which becomes "resource.id"
 * @type {AttributeConfig[]}
 */
export const TELEMETRY_ATTRIBUTES_MAP = [
  // Tool usage
  { key: "function.name", type: "string" },
  { key: "tools", type: "count" },
  { key: "tool_call_id", type: "string" },

  // Query
  { key: "text", type: "string" },
  { key: "subject", type: "string" },
  { key: "predicate", type: "string" },
  { key: "object", type: "string" },

  // Query filters
  { key: "filter.threshold", type: "number" },
  { key: "filter.limit", type: "number" },
  { key: "filter.max_tokens", type: "number" },

  // Other generic attributes
  { key: "identifiers", type: "count" },
  { key: "messages", type: "count" },
  { key: "context", type: "count" },
  { key: "conversation", type: "count" },
];
