/* eslint-env node */
import { trace } from "@copilot-ld/libtype";

/**
 * Represents a single span in a trace
 */
export class Span {
  #object;
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
    this.#object = {
      trace_id: traceId || this.#generateId(),
      span_id: this.#generateId(),
      parent_span_id: parentSpanId || "",
      name,
      kind,
      start_time_unix_nano: String(process.hrtime.bigint()),
      end_time_unix_nano: "",
      attributes: { "service.name": serviceName, ...attributes },
      events: [],
      status: { code: "STATUS_CODE_UNSET", message: "" },
    };
    this.#traceClient = traceClient;
  }

  /**
   * Adds an event to the span
   * @param {string} name - Event name
   * @param {object} [attributes] - Event attributes
   */
  addEvent(name, attributes = {}) {
    this.#object.events.push({
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
    this.#object.attributes[key] = String(value);
  }

  /**
   * Sets the span status
   * @param {object} status - Status object
   * @param {string} status.code - Status code: 'OK', 'ERROR', 'UNSET'
   * @param {string} [status.message] - Error message if code is ERROR
   */
  setStatus(status) {
    this.#object.status = {
      code: status.code || "STATUS_CODE_UNSET",
      message: status.message || "",
    };
  }

  /**
   * Ends the span and sends it to trace service
   * @returns {Promise<void>}
   */
  async end() {
    this.#object.end_time_unix_nano = String(process.hrtime.bigint());

    try {
      const span = trace.Span.fromObject(this.#object);
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
  get trace_id() {
    return this.#object.trace_id;
  }

  /**
   * Sets the trace ID
   * @param {string} trace_id - New trace ID
   */
  set trace_id(trace_id) {
    this.#object.trace_id = trace_id;
  }

  /**
   * Gets the span ID
   * @returns {string} Span ID
   */
  get span_id() {
    return this.#object.span_id;
  }

  /**
   * Gets the parent span ID
   * @returns {string} Parent span ID
   */
  get parent_span_id() {
    return this.#object.parent_span_id;
  }

  /**
   * Sets the parent span ID
   * @param {string} parent_span_id - New parent span ID
   */
  set parent_span_id(parent_span_id) {
    this.#object.parent_span_id = parent_span_id;
  }
}
