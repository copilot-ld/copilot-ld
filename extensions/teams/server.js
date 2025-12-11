import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureAdapter } from "./lib/adapter/configure-adapter.js";
import { CopilotLdBot } from "./lib/bot/copilot-ld-bot.js";
import { authorize, getTenantId } from "./lib/auth.js";
import { TenantClientService } from "./lib/tenant/client-service.js";
import { TenantConfigRepository } from "./lib/tenant/config-repository.js";
import { TenantSecretEncryption } from "./lib/tenant/secret-encryption.js";
import { HtmlRenderer } from "./lib/html/renderer.js";
import { patchResponse, parseBody } from "./lib/http.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * HTTP server for hosting a Microsoft Teams bot using Copilot-LD.
 */
export class TeamsServer {
  #tenantClientService;
  #htmlRenderer;
  #adapter;
  #bot;
  #server;

  /**
   * Creates a new TeamsServer instance
   * @param {object} config - Extension configuration
   * @param {TenantClientService} tenantClientService - Service for tenant management
   * @param {HtmlRenderer} htmlRenderer - Renderer for static HTML files
   * @param {object} adapter - Bot adapter instance
   * @param {CopilotLdBot} bot - CopilotLdBot instance
   */
  constructor(config, tenantClientService, htmlRenderer, adapter, bot) {
    if (!config) throw new Error("config is required");
    if (!tenantClientService)
      throw new Error("tenantClientService is required");
    if (!htmlRenderer) throw new Error("htmlRenderer is required");
    if (!adapter) throw new Error("adapter is required");
    if (!bot) throw new Error("bot is required");

    this.#tenantClientService = tenantClientService;
    this.#htmlRenderer = htmlRenderer;
    this.#adapter = adapter;
    this.#bot = bot;
    this.#server = this.#createHttpServer();
  }

  /**
   * Gets the underlying HTTP server instance
   * @returns {http.Server} The HTTP server
   */
  get server() {
    return this.#server;
  }

  /**
   * Serves the main.css static file for /main.css endpoint
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  #handleCss(req, res) {
    console.log("GET /main.css");
    this.#htmlRenderer.serve("main.css", res, "text/css");
  }

  /**
   * Serves the settings.js static file for /settings.js endpoint
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  #handleSettingsJs(req, res) {
    console.log("GET /settings.js");
    this.#htmlRenderer.serve("settings.js", res, "application/javascript");
  }

  /**
   * Serves the about.html static page for /about endpoint
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  #handleAbout(req, res) {
    console.log("GET /about");
    this.#htmlRenderer.serve("about.html", res);
  }

  /**
   * Serves the messages.html static page for /messages endpoint
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  #handleMessages(req, res) {
    console.log("GET /messages");
    this.#htmlRenderer.serve("messages.html", res);
  }

  /**
   * Handles POST requests to /api/messages for Bot Framework protocol
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  async #handleApiMessages(req, res) {
    console.log("POST /api/messages");
    req.body = await parseBody(req);
    patchResponse(res);
    try {
      await this.#adapter.process(req, res, (context) =>
        this.#bot.run(context),
      );
    } catch (err) {
      console.error("Error in adapter.process:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
      }
      res.end("Internal Server Error");
    }
  }

  /**
   * Serves the settings.html static page for /settings endpoint
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  #handleGetSettings(req, res) {
    console.log("GET /settings");
    this.#htmlRenderer.serve("settings.html", res);
  }

  /**
   * Handles POST requests to /api/settings for saving settings with admin auth check
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  #handleSaveSettings(req, res) {
    console.log("POST /api/settings");
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
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

      try {
        await this.#tenantClientService.saveTenantConfig(
          tenantId,
          parsed.host,
          parsed.port,
          parsed.secret,
        );
        console.log(
          `Tenant config saved for tenant ${tenantId} with new settings`,
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", message: "Settings saved" }));
      } catch (err) {
        console.error("Error saving tenant config:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to save settings" }));
      }
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
  async #handleGetApiSettings(req, res) {
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
    const config = await this.#tenantClientService.getTenantConfig(tenantId);
    const host = config?.host || "";
    const port = config?.port || "";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ host, port }));
  }

  /**
   * Creates and configures the HTTP server with route handling
   * @returns {http.Server} The configured HTTP server
   */
  #createHttpServer() {
    const routes = {
      "GET /main.css": (req, res) => this.#handleCss(req, res),
      "GET /settings.js": (req, res) => this.#handleSettingsJs(req, res),
      "GET /about": (req, res) => this.#handleAbout(req, res),
      "GET /messages": (req, res) => this.#handleMessages(req, res),
      "GET /settings": (req, res) => this.#handleGetSettings(req, res),
      "GET /api/settings": (req, res) => this.#handleGetApiSettings(req, res),
      "POST /api/messages": (req, res) => this.#handleApiMessages(req, res),
      "POST /api/settings": (req, res) => this.#handleSaveSettings(req, res),
    };

    return http.createServer(async (req, res) => {
      const routeKey = `${req.method} ${req.url}`;
      const handler = routes[routeKey];

      if (handler) {
        await handler(req, res);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    });
  }

  /**
   * Starts the server listening on the specified port
   * @param {number} port - Port number to listen on
   * @param {Function} callback - Callback function when server starts
   */
  listen(port, callback) {
    this.#server.listen(port, callback);
  }

  /**
   * Closes the server
   * @param {Function} callback - Callback function when server closes
   */
  close(callback) {
    this.#server.close(callback);
  }
}

/**
 * Creates and configures a new TeamsServer instance
 * @param {object} agentConfig - Service configuration
 * @param {object} extensionConfig - Extension configuration
 * @returns {TeamsServer} Configured server instance
 */
export default function createServer(agentConfig, extensionConfig) {
  if (!agentConfig) throw new Error("agentConfig is required");
  if (!extensionConfig) throw new Error("extensionConfig is required");

  // Initialize tenant management dependencies
  const tenantConfigRepository = new TenantConfigRepository();
  const tenantSecretEncryption = new TenantSecretEncryption({
    masterKey: extensionConfig.master_key,
  });
  const tenantClientService = new TenantClientService(
    tenantConfigRepository,
    tenantSecretEncryption,
  );

  // HtmlRenderer instance for serving static HTML files
  const htmlRenderer = new HtmlRenderer(__dirname);

  // Configure adapter for bot requests
  const adapter = configureAdapter(extensionConfig);

  // Instantiate the CopilotLdBot with required dependencies
  const bot = new CopilotLdBot(
    extensionConfig,
    tenantConfigRepository,
    tenantSecretEncryption,
  );

  return new TeamsServer(
    extensionConfig,
    tenantClientService,
    htmlRenderer,
    adapter,
    bot,
  );
}
