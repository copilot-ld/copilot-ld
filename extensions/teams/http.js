/**
 * Parses the JSON body from an incoming HTTP request.
 * @param {import('http').IncomingMessage} req - The HTTP request object.
 * @returns {Promise<object>} The parsed JSON object, or an empty object if parsing fails.
 */
export function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}
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
