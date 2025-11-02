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
  #grpcMetadata;

  /**
   * Creates a new tracer instance
   * @param {object} options - Tracer configuration
   * @param {string} options.serviceName - Name of the service
   * @param {object} options.traceClient - Trace service client
   * @param {Function} options.grpcMetadata - gRPC Metadata constructor for creating metadata instances
   */
  constructor({ serviceName, traceClient, grpcMetadata }) {
    if (!serviceName) throw new Error("serviceName is required");
    if (!traceClient) throw new Error("traceClient is required");
    if (!grpcMetadata) throw new Error("grpcMetadata is required");

    this.#serviceName = serviceName;
    this.#traceClient = traceClient;
    this.#grpcMetadata = grpcMetadata;
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
   * @param {object} [request] - Request object that may contain resource_id
   * @param {import("@grpc/grpc-js").Metadata} [metadata] - gRPC Metadata object containing trace context
   * @returns {Span} Started SERVER span with parent context
   */
  startServerSpan(service, method, request = null, metadata = null) {
    const span = this.startSpan(`${service}.${method}`, {
      kind: "SERVER",
      attributes: {
        "rpc.service": service,
        "rpc.method": method,
      },
    });

    // Apply trace context and resource ID from metadata (cross-service propagation)
    if (metadata) {
      this.#getMetadata(metadata, span);
    }

    // Set resource_id from request object (takes precedence over metadata)
    if (request?.resource_id) {
      span.resource_id = request.resource_id;
    }

    return span;
  }

  /**
   * Starts a CLIENT span for outgoing gRPC calls with automatic RPC attributes
   * Uses the active span from AsyncLocalStorage as parent
   * Creates metadata and populates it with trace context for propagation
   * @param {string} service - Service name (e.g., 'Agent', 'Vector')
   * @param {string} method - Method name (e.g., 'ProcessRequest', 'QueryItems')
   * @param {object} [request] - Request object that may contain resource_id
   * @returns {{span: Span, metadata: import("@grpc/grpc-js").Metadata}} Started CLIENT span and populated metadata
   */
  startClientSpan(service, method, request = null) {
    const parentSpan = this.#spanContext.getStore();

    const span = this.startSpan(`${service}.${method}`, {
      kind: "CLIENT",
      attributes: {
        "rpc.service": service,
        "rpc.method": method,
      },
      // Use parent span's trace context if available
      traceId: parentSpan?.trace_id,
      parentSpanId: parentSpan?.span_id,
    });

    // Inherit resource_id from parent span (local propagation)
    if (parentSpan?.resource_id) {
      span.resource_id = parentSpan.resource_id;
    }

    // Set resource_id from request object (takes precedence)
    if (request?.resource_id) {
      span.resource_id = request.resource_id;
    }

    // Create metadata and populate with trace context and resource_id
    const metadata = new this.#grpcMetadata();
    this.#setMetadata(metadata, span);

    return { span, metadata };
  }

  /**
   * Extracts trace context from gRPC metadata
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object containing trace context
   * @param {Span} [span] - Optional span to apply trace context to
   * @private
   */
  #getMetadata(metadata, span = null) {
    if (!span) return;

    const traceId = metadata?.get("x-trace-id")?.[0];
    const parentSpanId = metadata?.get("x-span-id")?.[0];
    const resourceId = metadata?.get("x-resource-id")?.[0];

    if (traceId) span.trace_id = traceId;
    if (parentSpanId) span.parent_span_id = parentSpanId;
    if (resourceId) span.resource_id = resourceId;
  }

  /**
   * Sets trace context in gRPC metadata for outgoing calls
   * @param {import("@grpc/grpc-js").Metadata} metadata - gRPC Metadata object to populate
   * @param {Span} span - Current span providing trace context
   * @private
   */
  #setMetadata(metadata, span) {
    metadata.set("x-trace-id", span.trace_id);
    metadata.set("x-span-id", span.span_id);
    
    // Propagate resource_id if present
    if (span.resource_id) {
      metadata.set("x-resource-id", span.resource_id);
    }
  }
}
