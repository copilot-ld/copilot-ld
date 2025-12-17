import { describe, test } from "node:test";
import assert from "node:assert";
import { PassThrough } from "node:stream";

import { JsonRpcConnection } from "../index.js";

/**
 * Encode a JSON-RPC message with `Content-Length` framing.
 * @param {object} message - JSON-RPC message
 * @returns {Buffer} Framed payload
 */
function frame(message) {
  const json = JSON.stringify(message);
  const payload = Buffer.from(json, "utf8");
  const header = Buffer.from(
    `Content-Length: ${payload.length}\r\n\r\n`,
    "utf8",
  );
  return Buffer.concat([header, payload]);
}

/**
 * Read and decode a single framed JSON-RPC message from a stream.
 * @param {import("node:stream").Readable} stream - Readable stream
 * @returns {Promise<any>} Parsed JSON message
 */
function readOne(stream) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer} */
    let buffer = Buffer.alloc(0);

    /**
     * Reject the read operation.
     * @param {Error} error - Stream error
     */
    function onError(error) {
      cleanup();
      reject(error);
    }

    /** Remove all stream listeners for this read. */
    function cleanup() {
      stream.off("data", onData);
      stream.off("error", onError);
    }

    /**
     * Buffer chunks until a full message is available.
     * @param {Buffer} chunk - Stream data
     */
    function onData(chunk) {
      buffer = Buffer.concat([buffer, chunk]);

      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const headerText = buffer.subarray(0, headerEnd).toString("utf8");
      const match = headerText.match(/Content-Length: (\d+)/i);
      if (!match) {
        cleanup();
        reject(new Error("Missing Content-Length header"));
        return;
      }

      const contentLength = Number.parseInt(match[1], 10);
      const payloadStart = headerEnd + 4;
      const payloadEnd = payloadStart + contentLength;
      if (buffer.length < payloadEnd) return;

      const payload = buffer.subarray(payloadStart, payloadEnd);
      cleanup();
      resolve(JSON.parse(payload.toString("utf8")));
    }

    stream.on("data", onData);
    stream.on("error", onError);
  });
}

describe("JsonRpcConnection", () => {
  test("emits parsed messages from framed input", async () => {
    const input = new PassThrough();
    const output = new PassThrough();

    const connection = new JsonRpcConnection(input, output);

    const received = new Promise((resolve) => {
      connection.on("message", resolve);
    });

    connection.start();
    input.write(frame({ jsonrpc: "2.0", method: "ping" }));

    assert.deepStrictEqual(await received, { jsonrpc: "2.0", method: "ping" });
  });

  test("writes framed JSON-RPC messages to output", async () => {
    const input = new PassThrough();
    const output = new PassThrough();

    const connection = new JsonRpcConnection(input, output);

    connection.sendResult(1, { ok: true });

    assert.deepStrictEqual(await readOne(output), {
      jsonrpc: "2.0",
      id: 1,
      result: { ok: true },
    });
  });
});
