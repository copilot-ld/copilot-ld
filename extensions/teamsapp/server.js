import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureAdapter } from "./configureAdapter.js";
import { CopilotLdBot } from "./copilotldbot.js";
import { clients } from "@copilot-ld/librpc";
import {
  createServiceConfig,
  createExtensionConfig,
} from "@copilot-ld/libconfig";
import { Interceptor, HmacAuth } from "@copilot-ld/librpc";
import { authorize, getTenantId } from "./auth.js";
import { TenantClientRepository } from "./tenant-client-repository.js";
import { HtmlRenderer } from "./htmlRenderer.js";
import { patchResponse, parseBody } from "./http.js";

const tenantClientRepository = new TenantClientRepository();

// HtmlRenderer instance for serving static HTML files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlRenderer = new HtmlRenderer(__dirname);

/**
 * Serves the about.html static page for /about endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleAbout(req, res) {
  console.log("GET /about");
  htmlRenderer.serveHtml("public/about.html", res);
}

/**
 * Serves the messages.html static page for /messages endpoint.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
function handleMessages(req, res) {
  console.log("GET /messages");
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
  htmlRenderer.serveHtml("public/settings.html", res);
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

    buildClient(parsed.host, parsed.port, parsed.secret)
      .then((client) => {
        tenantClientRepository.save(tenantId, client);
        console.log(
          `AgentClient rebuilt for tenant ${tenantId} with new settings`,
        );
      })
      .catch((err) => {
        //TODO throw error back to user
        console.error("Error rebuilding AgentClient:", err);
      });
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
  const client = tenantClientRepository.get(tenantId);
  const host = client?.config?.host || "";
  const port = client?.config?.port || "";
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ host, port }));
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

  const createAuth = () => {
    return new Interceptor(new HmacAuth(secret), serviceConfig.name);
  };

  return new clients.AgentClient(serviceConfig, null, null, createAuth);
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
  const myBot = new CopilotLdBot(tenantClientRepository, config);

  // Create the HTTP server
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/about") {
      handleAbout(req, res);
      return;
    }
    if (req.method === "GET" && req.url === "/messages") {
      handleMessages(req, res);
      return;
    }
    if (req.method === "GET" && req.url === "/settings") {
      handleGetSettings(req, res);
      return;
    }
    if (req.method === "GET" && req.url === "/api/settings") {
      handleGetApiSettings(req, res);
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
