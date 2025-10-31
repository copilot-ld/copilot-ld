/* eslint-env node */
import { AsyncLocalStorage } from "node:async_hooks";

import { Span } from "./span.js";

/**
 * Metadata attribute mapping configuration
 * Maps gRPC metadata headers to span attributes with type handling
 * @typedef {object} AttributeConfig
 * @property {string} metadataKey - gRPC metadata header name (e.g., 'x-resource-id')
 * @property {string} spanAttribute - Span attribute name (e.g., 'request.resource_id')
 * @property {string} type - Type: 'string' for direct value, 'count' for array length
 * @property {string} [requestField] - Field name in request object for 'count' type
 */

/**
 * Standard request attributes to parse from metadata and requests
 * @type {AttributeConfig[]}
 */
const REQUEST_ATTRIBUTE_MAP = [
  {
    metadataKey: "x-identifiers-count",
    spanAttribute: "request.identifiers",
    requestField: "identifiers",
    type: "count",
  },
  {
    metadataKey: "x-messages-count",
    spanAttribute: "request.messages",
    requestField: "messages",
    type: "count",
  },
  {
    metadataKey: "x-resource-id",
    spanAttribute: "request.resource_id",
    requestField: "resource_id",
    type: "string",
  },
  {
    metadataKey: "x-resources-count",
    spanAttribute: "request.resources",
    requestField: "resources",
    type: "count",
  },
  {
    metadataKey: "x-tool-call-id",
    spanAttribute: "request.tool_call_id",
    requestField: "tool_call_id",
    type: "string",
  },
  {
    metadataKey: "x-tools-count",
    spanAttribute: "request.tools",
    requestField: "tools",
    type: "count",
  },
];

/**
 * Tracer for creating and managing spans
 */
export class Tracer {
  #serviceName;
  #traceClient;
  #spanContext;

  /**
   * Creates a new tracer instance
   * @param {object} options - Tracer configuration
   * @param {string} options.serviceName - Name of the service
   * @param {object} options.traceClient - Trace service client
   */
  constructor({ serviceName, traceClient }) {
    if (!serviceName) throw new Error("serviceName is required");
    if (!traceClient) throw new Error("traceClient is required");

    this.#serviceName = serviceName;
    this.#traceClient = traceClient;
    this.#spanContext = new AsyncLocalStorage();
  }

  /**
   * Returns the AsyncLocalStorage for this tracer instance
   * Used by Server to establish span context
   * @returns {AsyncLocalStorage} AsyncLocalStorage instance
   */
  getSpanContext() {
    return this.#spanContext;
  }

  /**
   * Starts a new span with optional parent context
   * @param {string} name - Span name (e.g., 'AgentService.ProcessRequest')
   * @param {object} options - Span options
   * @param {string} options.kind - Span kind: 'SERVER', 'CLIENT', 'INTERNAL'
   * @param {object} [options.attributes] - Initial span attributes
   * @param {string} [options.traceId] - Trace ID from parent context
   * @param {string} [options.parentSpanId] - Parent span ID from parent context
   * @returns {Span} Started span
   */
  startSpan(name, options = {}) {
    const span = new Span({
      name,
      serviceName: this.#serviceName,
      kind: options.kind || "INTERNAL",
      attributes: options.attributes || {},
      traceId: options.traceId,
      parentSpanId: options.parentSpanId,
      traceClient: this.#traceClient,
    });

    return span;
  }

  /**
   * Starts a SERVER span for incoming gRPC calls with trace context from metadata
   * @param {string} service - Service name (e.g., 'Agent', 'Vector')
   * @param {string} method - Method name (e.g., 'ProcessRequest', 'QueryItems')
   * @param {import("@grpc/grpc-js").Metadata} [metadata] - gRPC Metadata object containing trace context
   * @param {object} [attributes] - Additional span attributes
   * @returns {Span} Started SERVER span with parent context
   */
  startServerSpan(service, method, metadata = null, attributes = {}) {
    const span = this.startSpan(`${service}.${method}`, {
      kind: "SERVER",
      attributes: {
        "rpc.service": service,
        "rpc.method": method,
        ...attributes,
      },
    });

    // Apply trace context and resource ID from metadata
    if (metadata) {
      this.getMetadata(metadata, span);
    }

    return span;
  }

  /**
   * Starts a CLIENT span for outgoing gRPC calls with automatic RPC attributes
   * Uses the active span from AsyncLocalStorage as parent
   * @param {string} service - Service name (e.g., 'Agent', 'Vector')
   * @param {string} method - Method name (e.g., 'ProcessRequest', 'QueryItems')
   * @param {import("@grpc/grpc-js").Metadata} [metadata] - gRPC Metadata object to populate with trace context
   * @param {object} [attributes] - Additional span attributes
   * @param {object} [request] - Request object that may contain resource_id
   * @returns {Span} Started CLIENT span
   */
  startClientSpan(
    service,
    method,
    metadata = null,
    attributes = {},
    request = null,
  ) {
    const parentSpan = this.#spanContext.getStore();

    const span = this.startSpan(`${service}.${method}`, {
      kind: "CLIENT",
      attributes: {
        "rpc.service": service,
        "rpc.method": method,
        ...attributes,
      },
      // Use parent span's trace context if available
      traceId: parentSpan?.traceId,
      parentSpanId: parentSpan?.spanId,
    });

    // Populate metadata with trace context if provided
    if (metadata) {
      this.setMetadata(metadata, span, request);
    }

    return span;
  }

  /**
   * Extracts trace context and attributes from gRPC metadata
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object containing trace context
   * @param {Span} [span] - Optional span to apply trace context and resource ID to
   */
  getMetadata(metadata, span = null) {
    if (!span) return;

    const traceId = metadata?.get("x-trace-id")?.[0];
    const parentSpanId = metadata?.get("x-span-id")?.[0];

    if (traceId) span.traceId = traceId;
    if (parentSpanId) span.parentSpanId = parentSpanId;

    // Extract request attributes
    this.#extractRequestAttributes(metadata, span);
  }

  /**
   * Sets trace context and request attributes in gRPC metadata for outgoing calls
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object to populate
   * @param {Span} span - Current span providing trace context
   * @param {object} [request] - Request object that may contain request attributes
   */
  setMetadata(metadata, span, request = null) {
    metadata.set("x-trace-id", span.traceId);
    metadata.set("x-span-id", span.spanId);

    // Set request attributes
    if (request) {
      this.#setRequestAttributes(metadata, span, request);
    }
  }

  /**
   * Extracts request attributes from metadata
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object
   * @param {Span} span - Span to apply attributes to
   */
  #extractRequestAttributes(metadata, span) {
    for (const config of REQUEST_ATTRIBUTE_MAP) {
      const value = metadata?.get(config.metadataKey)?.[0];
      if (value === undefined) continue;

      const parsed = config.type === "count" ? parseInt(value, 10) : value;
      span.setAttribute(config.spanAttribute, parsed);
    }
  }

  /**
   * Sets request attributes in metadata
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object
   * @param {Span} span - Current span
   * @param {object} request - Request object containing attributes
   */
  #setRequestAttributes(metadata, span, request) {
    for (const config of REQUEST_ATTRIBUTE_MAP) {
      const value = request[config.requestField];
      if (value === undefined || value === null) continue;

      if (config.type === "count") {
        const count = Array.isArray(value) ? value.length : 0;
        metadata.set(config.metadataKey, count.toString());
        span.setAttribute(config.spanAttribute, count);
      } else {
        metadata.set(config.metadataKey, value);
        span.setAttribute(config.spanAttribute, value);
      }
    }
  }
}
