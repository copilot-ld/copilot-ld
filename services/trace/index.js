/* eslint-env node */
import { services } from "@copilot-ld/librpc";
import { TraceIndex } from "@copilot-ld/libtelemetry";

const { TraceBase } = services;

/**
 * Trace service for receiving and storing trace spans
 */
export class TraceService extends TraceBase {
  #index;

  /**
   * Creates a new Trace service instance
   * Note: Trace service does NOT accept a tracer parameter to avoid infinite recursion
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration
   * @param {TraceIndex} traceIndex - Initialized TraceIndex for storing traces
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, traceIndex, logFn) {
    super(config, logFn);
    if (!traceIndex) throw new Error("traceIndex is required");

    this.#index = traceIndex;
  }

  /**
   * Records a span to the trace index
   * @param {import("@copilot-ld/libtype").trace.Span} req - Span to record
   * @returns {Promise<import("@copilot-ld/libtype").trace.RecordSpanResponse>} Response
   */
  async RecordSpan(req) {
    if (!req.trace_id) throw new Error("trace_id is required");
    if (!req.span_id) throw new Error("span_id is required");

    await this.#index.add(req);
    return { success: true };
  }

  /**
   * Queries spans from the trace index
   * @param {import("@copilot-ld/libtype").trace.QueryRequest} req - Query request
   * @returns {Promise<import("@copilot-ld/libtype").trace.QueryResponse>} Response with spans
   */
  async QuerySpans(req) {
    if (!req.trace_id && !req.resource_id) {
      throw new Error("Either trace_id or resource_id is required");
    }

    const spans = await this.#index.queryItems(req);
    return { spans };
  }

  /**
   * Graceful shutdown with final flush
   * @returns {Promise<void>}
   */
  async shutdown() {
    await this.#index.flush();
  }
}
