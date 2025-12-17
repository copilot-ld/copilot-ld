/* eslint-env node */
import { EventEmitter } from "node:events";

/**
 * @typedef {object} JsonRpcError
 * @property {number} code - JSON-RPC error code
 * @property {string} message - Human-readable error message
 * @property {any} [data] - Optional error payload
 */

/**
 * @typedef {object} JsonRpcRequest
 * @property {"2.0"} jsonrpc - Protocol version
 * @property {string} method - Method name
 * @property {any} [params] - Method parameters
 * @property {string|number|null} id - Request identifier
 */

/**
 * @typedef {(params: any, ctx: { id: string|number|null, method: string, message: JsonRpcRequest }) => any|Promise<any>} JsonRpcHandler
 */

/**
 * Minimal MCP server built on JSON-RPC 2.0.
 *
 * This class is intentionally small: it dispatches JSON-RPC requests to
 * registered handlers and emits notifications as events. MCP-specific methods
 * are implemented by registering handlers for the relevant method names.
 */
export class McpServer extends EventEmitter {
  #connection;
  #handlers;

  /**
   * Create a new MCP server.
   * @param {import("./jsonrpc/connection.js").JsonRpcConnection} connection - JSON-RPC connection
   */
  constructor(connection) {
    super();
    if (!connection) throw new Error("connection is required");

    this.#connection = connection;
    this.#handlers = new Map();
  }

  /**
   * Register a JSON-RPC method handler.
   * @param {string} method - JSON-RPC method name
   * @param {JsonRpcHandler} handler - Handler function
   * @returns {this} This server instance
   * @throws {Error} When method or handler are invalid
   */
  method(method, handler) {
    if (!method) throw new Error("method is required");
    if (typeof handler !== "function")
      throw new Error("handler must be a function");

    this.#handlers.set(method, handler);
    return this;
  }

  /**
   * Start processing incoming JSON-RPC messages.
   */
  start() {
    this.#connection.on("message", (message) => void this.#onMessage(message));
    this.#connection.on("error", (error) => this.emit("error", error));
    this.#connection.start();
  }

  /**
   * Validate and dispatch a single incoming JSON-RPC message.
   * @param {any} message - Incoming parsed JSON message
   */
  async #onMessage(message) {
    if (!this.#isObject(message)) return;
    if (typeof message.method !== "string") {
      this.emit("response", message);
      return;
    }

    if (message.jsonrpc !== "2.0") {
      if (Object.hasOwn(message, "id"))
        this.#sendInvalidRequest(message.id ?? null, "jsonrpc must be '2.0'");
      return;
    }

    if (Object.hasOwn(message, "id")) {
      await this.#handleRequest(message);
      return;
    }

    this.#handleNotification(message);
  }

  /**
   * Check if a value is a non-null object.
   * @param {any} value - Candidate object
   * @returns {boolean} True when value is a non-null object
   */
  #isObject(value) {
    return Boolean(value) && typeof value === "object";
  }

  /**
   * Send a JSON-RPC invalid request error.
   * @param {string|number|null} id - Request identifier
   * @param {string} reason - Validation failure reason
   */
  #sendInvalidRequest(id, reason) {
    this.#connection.sendError(id, {
      code: -32600,
      message: "Invalid Request",
      data: { reason },
    });
  }

  /**
   * Handle an incoming JSON-RPC notification.
   * @param {{ jsonrpc: "2.0", method: string, params?: any }} message - Notification message
   */
  #handleNotification(message) {
    this.emit("notification", message);
    this.emit(message.method, message.params);
  }

  /**
   * Handle an incoming JSON-RPC request and write the response.
   * @param {JsonRpcRequest} request - Request message
   */
  async #handleRequest(request) {
    const handler = this.#handlers.get(request.method);
    if (!handler) {
      this.#connection.sendError(request.id ?? null, {
        code: -32601,
        message: "Method not found",
      });
      return;
    }

    try {
      const result = await handler(request.params, {
        id: request.id ?? null,
        method: request.method,
        message: request,
      });
      this.#connection.sendResult(request.id ?? null, result);
    } catch (error) {
      /** @type {JsonRpcError} */
      const err = {
        code: -32603,
        message: "Internal error",
        data: {
          message: error instanceof Error ? error.message : String(error),
        },
      };
      this.#connection.sendError(request.id ?? null, err);
    }
  }
}
