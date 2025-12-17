/* eslint-env node */
import { test } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Encode a JSON-RPC message using LSP-style Content-Length framing.
 * @param {any} message - JSON-RPC message object
 * @returns {Buffer} Framed bytes
 */
function frameJsonRpcMessage(message) {
  const json = JSON.stringify(message);
  const payload = Buffer.from(json, "utf8");
  const header = Buffer.from(
    `Content-Length: ${payload.length}\r\n\r\n`,
    "utf8",
  );
  return Buffer.concat([header, payload]);
}

/**
 * Read a single framed JSON-RPC message from a stream.
 * @param {import("node:stream").Readable} stream - Stream to read from
 * @returns {Promise<any>} Parsed JSON message
 */
function readFramedJsonRpcMessage(stream) {
  return new Promise((resolvePromise, rejectPromise) => {
    /** @type {Buffer} */
    let buffer = Buffer.alloc(0);

    /**
     * Handle stdout stream errors.
     * @param {Error} error - Stream error
     */
    function onError(error) {
      cleanup();
      rejectPromise(error);
    }

    /**
     * Reject if stdout ends before a full frame is received.
     */
    function onEnd() {
      cleanup();
      rejectPromise(
        new Error("stdout ended before a full message was received"),
      );
    }

    /**
     * Accumulate bytes until a full frame is available.
     * @param {Buffer} chunk - Incoming bytes
     */
    function onData(chunk) {
      buffer = Buffer.concat([buffer, chunk]);

      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const headerText = buffer.subarray(0, headerEnd).toString("utf8");
      const match = headerText.match(/Content-Length: (\d+)/i);
      if (!match) {
        cleanup();
        rejectPromise(new Error("Missing Content-Length header"));
        return;
      }

      const contentLength = Number.parseInt(match[1], 10);
      const payloadStart = headerEnd + 4;
      const payloadEnd = payloadStart + contentLength;
      if (buffer.length < payloadEnd) return;

      const payload = buffer.subarray(payloadStart, payloadEnd);
      cleanup();

      try {
        resolvePromise(JSON.parse(payload.toString("utf8")));
      } catch (error) {
        rejectPromise(error);
      }
    }

    /**
     * Remove listeners after resolution.
     */
    function cleanup() {
      stream.off("data", onData);
      stream.off("error", onError);
      stream.off("end", onEnd);
    }

    stream.on("data", onData);
    stream.on("error", onError);
    stream.on("end", onEnd);
  });
}

test(
  "mcp-server tool responds to ping over stdio",
  { timeout: 2000 },
  async () => {
    const thisFile = fileURLToPath(import.meta.url);
    const rootDir = resolve(dirname(thisFile), "../../..");
    const serverScript = resolve(rootDir, "tools/mcp-server/bin/server.js");

    const child = spawn(process.execPath, [serverScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    /** @type {Buffer[]} */
    const stderrChunks = [];
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    try {
      child.stdin.write(
        frameJsonRpcMessage({
          jsonrpc: "2.0",
          id: 1,
          method: "ping",
        }),
      );
      child.stdin.end();

      const response = await readFramedJsonRpcMessage(child.stdout);

      assert.deepStrictEqual(response, {
        jsonrpc: "2.0",
        id: 1,
        result: { ok: true },
      });
    } catch (error) {
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      if (stderr) {
        throw new Error(
          `${error instanceof Error ? error.message : String(error)}\n\nServer stderr:\n${stderr}`,
        );
      }
      throw error;
    } finally {
      child.kill();
      await once(child, "exit");
    }
  },
);
