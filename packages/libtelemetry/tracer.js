/* eslint-env node */
import { AsyncLocalStorage } from "node:async_hooks";

import { Span } from "./span.js";

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
   * @returns {Span} Started CLIENT span
   */
  startClientSpan(service, method, metadata = null, attributes = {}) {
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
      this.setMetadata(metadata, span);
    }

    return span;
  }

  /**
   * Extracts trace context from gRPC metadata
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object containing trace context
   * @param {Span} [span] - Optional span to apply trace context to
   */
  getMetadata(metadata, span = null) {
    if (!span) return;

    const traceId = metadata?.get("x-trace-id")?.[0];
    const parentSpanId = metadata?.get("x-span-id")?.[0];

    if (traceId) span.traceId = traceId;
    if (parentSpanId) span.parentSpanId = parentSpanId;
  }

  /**
   * Sets trace context in gRPC metadata for outgoing calls
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object to populate
   * @param {Span} span - Current span providing trace context
   */
  setMetadata(metadata, span) {
    metadata.set("x-trace-id", span.traceId);
    metadata.set("x-span-id", span.spanId);
  }
}
