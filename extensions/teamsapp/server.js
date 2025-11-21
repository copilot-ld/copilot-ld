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
import { authorize, getTenantId } from "./auth.js";
import { TenantClientRepository } from "./tenant-client-repository.js";
import { HtmlRenderer } from "./htmlRenderer.js";

const tenantClientRepository = new TenantClientRepository();

// HtmlRenderer instance for serving static HTML files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlRenderer = new HtmlRenderer(__dirname);

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
 * Serves the about.html static page for /about endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleAbout(req, res) {
  htmlRenderer.serveHtml("public/about.html", res);
}

/**
 * Serves the messages.html static page for /messages endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleMessages(req, res) {
  htmlRenderer.serveHtml("public/messages.html", res);
}

/**
 * Handles POST requests to /api/messages for Bot Framework protocol.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {object} adapter - Bot adapter instance
 * @param {object} myBot - CopilotLdBot instance
 */
async function handleApiMessages(req, res, adapter, myBot) {
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
}

/**
 * Serves the settings.html static page for /settings endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {string} dir - Directory path for static files
 */
/**
 * Serves the settings.html static page for /settings endpoint, restricted to tenant-wide admins.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {string} dir - Directory path for static files
 */
async function handleGetSettings(req, res, dir) {
  console.log("GET /settings");
  const tenantId = getTenantId(req);
  // Try to get current settings for this tenant (mocked for now)
  let host = "";
  let port = "";
  // If you have a settings store, fetch here. For now, try to get from client if available
  const client = tenantClientRepository.get(tenantId);
  if (client && client.config) {
    host = client.config.host || "";
    port = client.config.port || "";
  }

  const filePath = path.join(dir, "public/settings.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    } else {
      // Replace placeholders in HTML
      html = html
        .replace(/value="\{\{HOST\}\}"/, `value="${host}"`)
        .replace(/value="\{\{PORT\}\}"/, `value="${port}"`);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    }
  });
}

/**
 * Handles POST requests to /api/settings for saving settings with admin auth check.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleSaveSettings(req, res) {
  console.log("POST /api/settings");
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    try {
      // Auth check
      authorize(req);
    } catch (err) {
      console.error("Authorization error:", err);
      res.writeHead(err.statusCode || 401, { "Content-Type": "text/plain" });
      res.end(err.message || "Unauthorized");
      return;
    }
    const tenantId = getTenantId(req);

    buildClient(body.host, body.port, body.secret)
      .then((client) => {
        tenantClientRepository.save(tenantId, client);
        console.log(
          `AgentClient rebuilt for tenant ${tenantId} with new settings`,
        );
      })
      .catch((err) => {
        console.error("Error rebuilding AgentClient:", err);
      });
    // TODO: Save settings logic here
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", message: "Settings saved (TODO)" }));
  });
  req.on("error", () => {
    console.error("Error reading request body");
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error reading request body");
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
  const myBot = new CopilotLdBot(tenantClientRepository, config);

  // Create the HTTP server
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/about") {
      handleAbout(req, res, __dirname);
      return;
    }
    if (req.method === "GET" && req.url === "/messages") {
      handleMessages(req, res, __dirname);
      return;
    }
    if (req.method === "GET" && req.url === "/settings") {
      handleGetSettings(req, res, __dirname);
      return;
    }
    if (req.method === "POST" && req.url === "/api/messages") {
      await handleApiMessages(req, res, adapter, myBot);
      return;
    }
    if (req.method === "POST" && req.url === "/api/settings") {
      handleSaveSettings(req, res);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  return server;
}

/**
 * Builds and returns an AgentClient with overridden config values.
 * @param {string} host - The agent service host
 * @param {number} port - The agent service port
 * @param {string} secret - The agent service secret
 * @returns {Promise<import("@copilot-ld/librpc").AgentClient>} Initialized AgentClient instance
 */
async function buildClient(host, port, secret) {
  const serviceConfig = await createServiceConfig("agent");
  if (host !== undefined) serviceConfig.host = host;
  if (port !== undefined) serviceConfig.port = port;
  if (secret !== undefined) serviceConfig.secret = secret;
  return new clients.AgentClient(serviceConfig);
}
