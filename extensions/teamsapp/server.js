import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureAdapter } from "./configureAdapter.js";
import { CopilotLdBot } from "./copilotldbot.js";
import { clients } from "@copilot-ld/librpc";
import {
  createServiceConfig,
  createExtensionConfig,
} from "@copilot-ld/libconfig";

/**
 * Patches a native HTTP response object with minimal Express-like methods for botbuilder compatibility.
 * @param {import('http').ServerResponse} res - The HTTP response object.
 */
function patchResponse(res) {
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

/**
 * Parses the JSON body from an incoming HTTP request.
 * @param {import('http').IncomingMessage} req - The HTTP request object.
 * @returns {Promise<object>} The parsed JSON object, or an empty object if parsing fails.
 */
function parseBody(req) {
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
 * Creates and configures a native HTTP server for hosting a Microsoft Teams bot using Copilot-LD.
 * Sets up HTTP endpoints for chat UI, bot message processing, and streaming connections.
 * @returns {Promise<http.Server>} Configured HTTP server instance.
 */
export default async function createServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Configure adapters for normal and streaming requests
  const adapter = configureAdapter();

  // Instantiate the CopilotLdBot with required dependencies
  const config = await createExtensionConfig("web");
  const agentClient = new clients.AgentClient(
    await createServiceConfig("agent"),
  );
  const myBot = new CopilotLdBot(agentClient, config);

  // Create the HTTP server
  const server = http.createServer(async (req, res) => {
    // Serve the chat UI HTML page at /chat
    if (req.method === "GET" && req.url === "/chat") {
      const filePath = path.join(__dirname, "chat.html");
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        } else {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        }
      });
      return;
    }

    // Listen for incoming bot message requests (Bot Framework protocol)
    if (req.method === "POST" && req.url === "/api/messages") {
      // Patch req and res to look like Express/Restify for botbuilder
      req.body = await parseBody(req);
      patchResponse(res);
      try {
        await adapter.process(req, res, (context) => myBot.run(context));
      } catch (err) {
        console.error("Error in adapter.process:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/plain" });
        }
        res.end("Internal Server Error");
      }
      return;
    }

    // Fallback for other routes
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  return server;
}
