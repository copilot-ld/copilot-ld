/* eslint-env node */
import { services } from "@copilot-ld/librpc";

const { TraceBase } = services;

/**
 * Trace service for receiving and storing trace spans
 */
export class TraceService extends TraceBase {
  #traceIndex;
  #exporter;

  /**
   * Creates a new Trace service instance
   * Note: Trace service does NOT accept a tracer parameter to avoid infinite recursion
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration
   * @param {import("@copilot-ld/libindex").BufferedIndex} traceIndex - Buffered index for trace storage
   * @param {object} exporter - OTLP exporter for trace export (optional)
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, traceIndex, exporter, logFn) {
    super(config, logFn);
    if (!traceIndex) throw new Error("traceIndex is required");

    this.#traceIndex = traceIndex;
    this.#exporter = exporter;
  }

  /**
   * Records a span to the trace index
   * @param {import("@copilot-ld/libtype").trace.Span} req - Span to record
   * @returns {Promise<import("@copilot-ld/libtype").trace.RecordSpanResponse>} Response
   */
  async RecordSpan(req) {
    // Extract resource_id from events for easier querying
    let resourceId = null;
    if (req.events) {
      for (const event of req.events) {
        if (event.attributes && event.attributes["resource.id"]) {
          resourceId = event.attributes["resource.id"];
          break;
        }
      }
    }

    const span = {
      id: req.span_id,
      trace_id: req.trace_id,
      span_id: req.span_id,
      parent_span_id: req.parent_span_id,
      name: req.name,
      kind: req.kind,
      start_time_unix_nano: req.start_time_unix_nano,
      end_time_unix_nano: req.end_time_unix_nano,
      attributes: req.attributes,
      events: req.events,
      status: req.status,
      resource_id: resourceId, // Add extracted resource_id for easier querying
    };

    // Add to buffered index (batched write)
    await this.#traceIndex.add(span);

    // Also export to OTLP if configured
    if (this.#exporter) {
      await this.#exporter.export(span);
    }

    return { success: true };
  }

  /**
   * Queries spans from the trace index
   * @param {import("@copilot-ld/libtype").trace.QuerySpansRequest} req - Query request
   * @returns {Promise<import("@copilot-ld/libtype").trace.QuerySpansResponse>} Response with spans
   */
  async QuerySpans(req) {
    // Flush buffer to ensure latest spans are queryable
    await this.#traceIndex.flush();

    // Use IndexBase queryItems for filtering
    const spans = [];
    const items = await this.#traceIndex.queryItems({
      prefix: req.trace_id ? req.trace_id : undefined,
      limit: req.limit || 1000,
    });

    // Since queryItems returns Identifier objects but we stored raw span objects,
    // we need to get the actual span data from the index
    for (const item of items) {
      if (item?.id) {
        const spanData = this.#traceIndex.index.get(item.id.toString());
        if (spanData) {
          spans.push(spanData);
        }
      }
    }

    return { spans };
  }

  /**
   * Flushes buffered traces to storage
   * @param {import("@copilot-ld/libtype").trace.FlushTracesRequest} _req - Flush request (unused)
   * @returns {Promise<import("@copilot-ld/libtype").trace.FlushTracesResponse>} Response with count
   */
  async FlushTraces(_req) {
    const flushedCount = await this.#traceIndex.flush();
    return { flushed_count: flushedCount };
  }

  /**
   * Graceful shutdown with final flush
   * @returns {Promise<void>}
   */
  async shutdown() {
    await this.#traceIndex.shutdown();
    if (this.#exporter) {
      await this.#exporter.shutdown();
    }
  }
}
