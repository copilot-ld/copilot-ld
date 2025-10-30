/* eslint-env node */
import { trace } from "@copilot-ld/libtype";

/**
 * Represents a single span in a trace
 */
export class Span {
  #traceId;
  #spanId;
  #parentSpanId;
  #name;
  #kind;
  #startTime;
  #endTime;
  #attributes;
  #events;
  #status;
  #traceClient;

  /**
   * Creates a new Span instance
   * @param {object} options - Span options
   * @param {string} options.name - Span name
   * @param {string} options.serviceName - Service name
   * @param {string} options.kind - Span kind (SERVER, CLIENT, INTERNAL)
   * @param {object} options.attributes - Initial span attributes
   * @param {string} [options.traceId] - Trace ID from parent context
   * @param {string} [options.parentSpanId] - Parent span ID from parent context
   * @param {object} options.traceClient - Trace service client
   */
  constructor({
    name,
    serviceName,
    kind,
    attributes,
    traceId,
    parentSpanId,
    traceClient,
  }) {
    this.#traceId = traceId || this.#generateId();
    this.#spanId = this.#generateId();
    this.#parentSpanId = parentSpanId || "";
    this.#name = name;
    this.#kind = kind;
    this.#startTime = process.hrtime.bigint();
    this.#attributes = { "service.name": serviceName, ...attributes };
    this.#events = [];
    this.#status = { code: "STATUS_CODE_UNSET", message: "" };
    this.#traceClient = traceClient;
  }

  /**
   * Adds an event to the span
   * @param {string} name - Event name
   * @param {object} [attributes] - Event attributes
   */
  addEvent(name, attributes = {}) {
    this.#events.push({
      name,
      time_unix_nano: String(process.hrtime.bigint()),
      attributes,
    });
  }

  /**
   * Sets an attribute on the span
   * @param {string} key - Attribute key
   * @param {string} value - Attribute value
   */
  setAttribute(key, value) {
    this.#attributes[key] = String(value);
  }

  /**
   * Sets the span status
   * @param {object} status - Status object
   * @param {string} status.code - Status code: 'OK', 'ERROR', 'UNSET'
   * @param {string} [status.message] - Error message if code is ERROR
   */
  setStatus(status) {
    this.#status = {
      code: status.code || "STATUS_CODE_UNSET",
      message: status.message || "",
    };
  }

  /**
   * Ends the span and sends it to trace service
   * @returns {Promise<void>}
   */
  async end() {
    this.#endTime = process.hrtime.bigint();

    try {
      const span = trace.Span.fromObject({
        trace_id: this.#traceId,
        span_id: this.#spanId,
        parent_span_id: this.#parentSpanId,
        name: this.#name,
        kind: this.#kind,
        start_time_unix_nano: String(this.#startTime),
        end_time_unix_nano: String(this.#endTime),
        attributes: this.#attributes,
        events: this.#events,
        status: this.#status,
      });

      await this.#traceClient.RecordSpan(span);
    } catch (error) {
      // Don't throw - tracing should never break the application
      console.error(`Failed to record span: ${error.message}`);
    }
  }

  /**
   * Generates a random hex ID for trace/span IDs
   * @returns {string} Random hex string
   */
  #generateId() {
    return Math.random().toString(16).substring(2, 18);
  }

  /**
   * Gets the trace ID
   * @returns {string} Trace ID
   */
  get traceId() {
    return this.#traceId;
  }

  /**
   * Sets the trace ID
   * @param {string} traceId - New trace ID
   */
  set traceId(traceId) {
    this.#traceId = traceId;
  }

  /**
   * Gets the span ID
   * @returns {string} Span ID
   */
  get spanId() {
    return this.#spanId;
  }

  /**
   * Gets the parent span ID
   * @returns {string} Parent span ID
   */
  get parentSpanId() {
    return this.#parentSpanId;
  }

  /**
   * Sets the parent span ID
   * @param {string} parentSpanId - New parent span ID
   */
  set parentSpanId(parentSpanId) {
    this.#parentSpanId = parentSpanId;
  }
}
