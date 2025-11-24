import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureAdapter } from "./configureAdapter.js";
import { CopilotLdBot } from "./copilotldbot.js";
import { createExtensionConfig } from "@copilot-ld/libconfig";
import { authorize, getTenantId } from "./auth.js";
import { TenantClientService } from "./tenant-client-service.js";
import { TenantConfigRepository } from "./tenant-config-repository.js";
import { TenantSecretEncryption } from "./tenant-secret-encryption.js";
import { HtmlRenderer } from "./htmlRenderer.js";
import { patchResponse, parseBody } from "./http.js";

// Initialize tenant management dependencies
const tenantConfigRepository = new TenantConfigRepository();
const masterKey = process.env.SERVICE_MASTER_KEY;
if (!masterKey) {
  throw new Error("SERVICE_MASTER_KEY environment variable is required");
}
const tenantSecretEncryption = new TenantSecretEncryption({ masterKey });
const tenantClientService = new TenantClientService(
  tenantConfigRepository,
  tenantSecretEncryption,
);

// HtmlRenderer instance for serving static HTML files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlRenderer = new HtmlRenderer(__dirname);

/**
 * Serves the main.css static file for /main.css endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleCss(req, res) {
  console.log("GET /main.css");
  htmlRenderer.serve("public/main.css", res, "text/css");
}

/**
 * Serves the about.html static page for /about endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleAbout(req, res) {
  console.log("GET /about");
  htmlRenderer.serve("public/about.html", res);
}

/**
 * Serves the messages.html static page for /messages endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleMessages(req, res) {
  console.log("GET /messages");
  htmlRenderer.serve("public/messages.html", res);
}

/**
 * Handles POST requests to /api/messages for Bot Framework protocol.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 * @param {object} adapter - Bot adapter instance
 * @param {object} myBot - CopilotLdBot instance
 */
async function handleApiMessages(req, res, adapter, myBot) {
  console.log("POST /api/messages");
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
 */
async function handleGetSettings(req, res) {
  console.log("GET /settings");
  htmlRenderer.serve("public/settings.html", res);
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
    let parsed = {};
    try {
      parsed = JSON.parse(body);
    } catch (err) {
      console.error("Error parsing JSON body:", err);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }
    const tenantId = getTenantId(req);

    tenantClientService.saveTenantConfig(
      tenantId,
      parsed.host,
      parsed.port,
      parsed.secret,
    );
    console.log(`Tenant config saved for tenant ${tenantId} with new settings`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", message: "Settings saved" }));
  });
  req.on("error", () => {
    console.error("Error reading request body");
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error reading request body");
  });
}

/**
 * Handles GET requests to /api/settings
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleGetApiSettings(req, res) {
  console.log("GET /api/settings");
  try {
    authorize(req);
  } catch (err) {
    res.writeHead(err.statusCode || 401, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify({ error: err.message || "Unauthorized" }));
    return;
  }
  const tenantId = getTenantId(req);
  const config = tenantClientService.getTenantConfig(tenantId);
  const host = config?.host || "";
  const port = config?.port || "";
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ host, port }));
}

/**
 * Creates and configures a native HTTP server for hosting a Microsoft Teams bot using Copilot-LD.
 * Sets up HTTP endpoints for chat UI, bot message processing, and streaming connections.
 * @returns {Promise<http.Server>} Configured HTTP server instance.
 */
export default async function createServer() {
  // Configure adapters for normal and streaming requests
  const adapter = configureAdapter();

  // Instantiate the CopilotLdBot with required dependencies
  const config = await createExtensionConfig("web");
  const myBot = new CopilotLdBot(tenantClientService, config);

  // Route map for all endpoints
  const routes = {
    "GET /main.css": handleCss,
    "GET /about": handleAbout,
    "GET /messages": handleMessages,
    "GET /settings": handleGetSettings,
    "GET /api/settings": handleGetApiSettings,
    "POST /api/messages": (req, res) =>
      handleApiMessages(req, res, adapter, myBot),
    "POST /api/settings": handleSaveSettings,
  };

  // Create the HTTP server
  const server = http.createServer(async (req, res) => {
    const routeKey = `${req.method} ${req.url}`;
    const handler = routes[routeKey];

    if (handler) {
      await handler(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });

  return server;
}
