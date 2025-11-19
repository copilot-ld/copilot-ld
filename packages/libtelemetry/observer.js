/* eslint-env node */
import { extractAttributes } from "./attributes.js";

/**
 * Observer class that unifies logging and tracing for RPC operations
 * Coordinates span lifecycle and automatic span events
 */
export class Observer {
  #logger;
  #tracer;

  /**
   * Creates a new Observer instance
   * @param {string} serviceName - Name of the service
   * @param {object} [logger] - Optional logger instance
   * @param {object} [tracer] - Optional tracer instance
   */
  constructor(serviceName, logger = null, tracer = null) {
    if (!serviceName || typeof serviceName !== "string") {
      throw new Error("serviceName must be a non-empty string");
    }

    this.#logger = logger;
    this.#tracer = tracer;
  }

  /**
   * Returns the logger instance
   * @returns {object} Logger instance
   */
  logger() {
    return this.#logger;
  }

  /**
   * Returns the tracer instance
   * @returns {object|null} Tracer instance or null
   */
  tracer() {
    return this.#tracer;
  }

  /**
   * Observes a client RPC call (outgoing)
   * @param {string} methodName - RPC method name
   * @param {object} request - Request object
   * @param {Function} callFn - Function that executes the gRPC call with metadata
   * @returns {Promise<object>} Response object
   */
  async observeClientCall(methodName, request, callFn) {
    this.#logEvent(methodName, "Request sent", request);

    try {
      // Delegate to tracer if available
      if (this.#tracer) {
        return await this.#tracer.observeClientCall(
          methodName,
          request,
          callFn,
          this.#logger,
        );
      }

      // Fallback without tracing
      const response = await callFn();
      this.#logEvent(methodName, "Response received", response);

      return response;
    } catch (error) {
      this.#logger?.error(methodName, error);
      throw error;
    }
  }

  /**
   * Observes a server RPC handler (incoming)
   * @param {string} methodName - RPC method name
   * @param {object} call - gRPC call object with metadata and request
   * @param {Function} handlerFn - Business logic handler function
   * @returns {Promise<object>} Response object
   */
  async observeServerCall(methodName, call, handlerFn) {
    this.#logEvent(methodName, "Request received", call.request);

    try {
      // Delegate to tracer if available
      if (this.#tracer) {
        return await this.#tracer.observeServerCall(
          methodName,
          call,
          handlerFn,
          this.#logger,
        );
      }

      // Fallback without tracing
      const response = await handlerFn(call);
      this.#logEvent(methodName, "Response sent", response);

      return response;
    } catch (error) {
      this.#logger?.error(methodName, error);
      throw error;
    }
  }

  /**
   * Logs an event with extracted attributes
   * @param {string} methodName - Method name
   * @param {string} eventName - Event name
   * @param {object} data - Event data (request or response)
   * @private
   */
  #logEvent(methodName, eventName, data) {
    if (!this.#logger || !this.#logger.enabled) return;
    const attributes = extractAttributes(data);

    // Resource ID has special meaning for tracing and therefore not part of
    // common attributes. Add it explicitly if present.
    if (data?.resource_id) attributes["resource_id"] = data.resource_id;

    this.#logger.debug(methodName, eventName, attributes);
  }
}

/**
 * Factory function to create an Observer instance
 * @param {string} serviceName - Name of the service
 * @param {object} [logger] - Optional logger instance
 * @param {object} [tracer] - Optional tracer instance
 * @returns {Observer} Configured observer instance
 */
export function createObserver(serviceName, logger = null, tracer = null) {
  return new Observer(serviceName, logger, tracer);
}
