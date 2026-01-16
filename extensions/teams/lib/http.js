import { parseJsonBody } from "@copilot-ld/libutil";

// Re-export parseJsonBody as parseBody for backward compatibility within this extension
export { parseJsonBody as parseBody };

/**
 * Patches a native HTTP response object with minimal Express-like methods for botbuilder compatibility.
 * @param {import('http').ServerResponse} res - The HTTP response object.
 */
export function patchResponse(res) {
  if (!res.status) {
    res.statusCode = 200;
    res.status = function (code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.send) {
    res.send = function (body) {
      if (!this.headersSent) {
        this.writeHead(this.statusCode, {
          "Content-Type": "application/json",
        });
      }
      this.end(typeof body === "string" ? body : JSON.stringify(body));
    };
  }
  if (!res.header) {
    res.header = function (name, value) {
      this.setHeader(name, value);
    };
  }
}
