/* eslint-env node */
import { REQUEST_ATTRIBUTE_MAP, RESPONSE_ATTRIBUTE_MAP } from "./attributes.js";

/**
 * Observer class that unifies logging and tracing for RPC operations
 * Coordinates span lifecycle and automatic span events
 */
export class Observer {
  #logger;
  #tracer;
  #serviceName;

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

    this.#serviceName = serviceName;
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
    // Start CLIENT span - it will create metadata if tracer exists
    const metadata = null; // Will be created by tracer if needed
    const span = this.#tracer?.startClientSpan(
      this.#serviceName,
      methodName,
      metadata,
      {},
      request,
    );

    // Log request.sent event
    this.#logEvent(
      "request.sent",
      methodName,
      this.#extractRequestAttributes(request),
    );
    span?.addEvent("request.sent", this.#extractRequestAttributes(request));

    try {
      // Execute the gRPC call - callFn will handle metadata creation
      const response = await callFn(metadata);

      // Log response.received event
      this.#logEvent(
        "response.received",
        methodName,
        this.#extractResponseAttributes(response),
      );
      span?.addEvent(
        "response.received",
        this.#extractResponseAttributes(response),
      );

      // Set span status and end
      span?.setStatus({ code: "OK" });
      await this.#endSpan(span);

      return response;
    } catch (error) {
      // Log error and set span status
      const errorMessage = error?.message || String(error);
      if (this.#logger) {
        this.#logger.debug(`gRPC call failed: ${methodName}`, {
          error: errorMessage,
        });
      }
      span?.setStatus({ code: "ERROR", message: errorMessage });
      await this.#endSpan(span);
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
    // Start SERVER span with metadata extraction
    const span = this.#tracer?.startServerSpan(
      this.#serviceName,
      methodName,
      call.metadata,
    );

    // Log request.received event
    this.#logEvent(
      "request.received",
      methodName,
      this.#extractRequestAttributes(call.request),
    );
    span?.addEvent(
      "request.received",
      this.#extractRequestAttributes(call.request),
    );

    // Get AsyncLocalStorage context if tracer is available
    const spanContext = span ? this.#tracer.getSpanContext() : null;

    // Execute handler within span context
    const executeHandler = async () => {
      try {
        const response = await handlerFn(call);

        // Log response.sent event
        this.#logEvent(
          "response.sent",
          methodName,
          this.#extractResponseAttributes(response),
        );
        span?.addEvent(
          "response.sent",
          this.#extractResponseAttributes(response),
        );

        // Set span status
        span?.setStatus({ code: "OK" });

        return response;
      } catch (handlerError) {
        const errorMessage = handlerError?.message || String(handlerError);
        if (this.#logger) {
          this.#logger.debug("RPC handler error", { error: errorMessage });
        }
        span?.setStatus({ code: "ERROR", message: errorMessage });
        throw handlerError;
      } finally {
        // End span before returning
        await this.#endSpan(span);
      }
    };

    // Run within span context if available
    return spanContext
      ? await spanContext.run(span, executeHandler)
      : await executeHandler();
  }

  /**
   * Extracts attributes from request for span events
   * @param {object} request - Request object
   * @returns {object} Extracted attributes
   * @private
   */
  #extractRequestAttributes(request) {
    const attributes = {};

    for (const config of REQUEST_ATTRIBUTE_MAP) {
      const value = this.#getNestedValue(request, config.protobuf);
      if (value === undefined || value === null) continue;

      if (config.type === "count") {
        const count = Array.isArray(value) ? value.length : 0;
        attributes[config.telemetry] = count;
      } else {
        attributes[config.telemetry] = value;
      }
    }

    return attributes;
  }

  /**
   * Extracts attributes from response for span events
   * @param {object} response - Response object
   * @returns {object} Extracted attributes
   * @private
   */
  #extractResponseAttributes(response) {
    const attributes = {};

    for (const config of RESPONSE_ATTRIBUTE_MAP) {
      const value = this.#getNestedValue(response, config.protobuf);
      if (value === undefined || value === null) continue;

      if (config.type === "count") {
        const count = Array.isArray(value) ? value.length : 0;
        attributes[config.telemetry] = count;
      } else if (config.type === "number") {
        attributes[config.telemetry] = Number(value);
      } else {
        attributes[config.telemetry] = value;
      }
    }

    return attributes;
  }

  /**
   * Helper to get nested object values (e.g., "usage.total_tokens")
   * @param {object} obj - Object to extract value from
   * @param {string} path - Dot-separated path to value
   * @returns {*} Value at path or undefined
   * @private
   */
  #getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Logs an event with attributes
   * @param {string} eventName - Event name
   * @param {string} methodName - Method name
   * @param {object} attributes - Event attributes
   * @private
   */
  #logEvent(eventName, methodName, attributes) {
    if (!this.#logger || !this.#logger.enabled) return;
    this.#logger.debug(`${eventName}: ${methodName}`, attributes);
  }

  /**
   * Ends a span with error handling
   * @param {object|null} span - Span instance or null
   * @returns {Promise<void>}
   * @private
   */
  async #endSpan(span) {
    if (!span) return;

    try {
      await span.end();
    } catch (endError) {
      if (this.#logger) {
        this.#logger.debug("Error ending span", {
          error: endError?.message || String(endError),
        });
      }
    }
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
