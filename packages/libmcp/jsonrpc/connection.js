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
 * @typedef {object} JsonRpcNotification
 * @property {"2.0"} jsonrpc - Protocol version
 * @property {string} method - Method name
 * @property {any} [params] - Method parameters
 */

/**
 * @typedef {object} JsonRpcResponse
 * @property {"2.0"} jsonrpc - Protocol version
 * @property {string|number|null} id - Request identifier
 * @property {any} [result] - Response result
 * @property {JsonRpcError} [error] - Response error
 */

/**
 * Minimal JSON-RPC 2.0 connection over a stream transport using LSP-style framing.
 * Messages are encoded as UTF-8 JSON with a `Content-Length` header.
 */
export class JsonRpcConnection extends EventEmitter {
  #readable;
  #writable;
  #buffer;

  /**
   * Create a new JSON-RPC connection.
   * @param {import("node:stream").Readable} readable - Input stream
   * @param {import("node:stream").Writable} writable - Output stream
   */
  constructor(readable, writable) {
    super();
    if (!readable) throw new Error("readable is required");
    if (!writable) throw new Error("writable is required");

    this.#readable = readable;
    this.#writable = writable;
    this.#buffer = Buffer.alloc(0);
  }

  /** Starts reading messages from the readable stream. */
  start() {
    this.#readable.on("data", (chunk) => {
      this.#buffer = Buffer.concat([this.#buffer, chunk]);
      this.#drain();
    });
    this.#readable.on("error", (error) => this.emit("error", error));
    this.#writable.on("error", (error) => this.emit("error", error));
  }

  /**
   * Send a JSON-RPC response.
   * @param {string|number|null} id - Request identifier
   * @param {any} result - Response payload
   */
  sendResult(id, result) {
    /** @type {JsonRpcResponse} */
    const msg = { jsonrpc: "2.0", id, result };
    this.#send(msg);
  }

  /**
   * Send a JSON-RPC error response.
   * @param {string|number|null} id - Request identifier
   * @param {JsonRpcError} error - Error payload
   */
  sendError(id, error) {
    /** @type {JsonRpcResponse} */
    const msg = { jsonrpc: "2.0", id, error };
    this.#send(msg);
  }

  /**
   * Send a JSON-RPC notification.
   * @param {string} method - Method name
   * @param {any} [params] - Notification params
   */
  notify(method, params) {
    /** @type {JsonRpcNotification} */
    const msg = { jsonrpc: "2.0", method, params };
    this.#send(msg);
  }

  /**
   * Send a JSON-RPC request.
   * @param {string} method - Method name
   * @param {any} [params] - Request params
   * @param {string|number|null} [id] - Request identifier
   */
  request(method, params, id) {
    /** @type {JsonRpcRequest} */
    const msg = { jsonrpc: "2.0", method, params, id };
    this.#send(msg);
  }

  /**
   * Encode and write a single JSON-RPC message with `Content-Length` framing.
   * @param {object} message - JSON-RPC message
   */
  #send(message) {
    const json = JSON.stringify(message);
    const payload = Buffer.from(json, "utf8");
    const header = Buffer.from(
      `Content-Length: ${payload.length}\r\n\r\n`,
      "utf8",
    );
    this.#writable.write(Buffer.concat([header, payload]));
  }

  /** Drains buffered bytes into complete JSON-RPC messages. */
  #drain() {
    while (true) {
      const headerEnd = this.#buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const headerText = this.#buffer.subarray(0, headerEnd).toString("utf8");
      const match = headerText.match(/Content-Length: (\d+)/i);
      if (!match) {
        this.emit("error", new Error("Missing Content-Length header"));
        return;
      }

      const contentLength = Number.parseInt(match[1], 10);
      const payloadStart = headerEnd + 4;
      const payloadEnd = payloadStart + contentLength;
      if (this.#buffer.length < payloadEnd) return;

      const payload = this.#buffer.subarray(payloadStart, payloadEnd);
      this.#buffer = this.#buffer.subarray(payloadEnd);

      let msg;
      try {
        msg = JSON.parse(payload.toString("utf8"));
      } catch (error) {
        this.emit("error", error);
        continue;
      }

      this.emit("message", msg);
    }
  }
}
