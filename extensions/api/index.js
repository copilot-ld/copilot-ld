import http from "node:http";

import { agent, common } from "@copilot-ld/libtype";
import { parseJsonBody } from "@copilot-ld/libutil";

/**
 * Authorizes incoming requests by validating the authorization token.
 */
export class LocalSecretAuthorizer {
  #secret;

  /**
   * Creates a new Authorizer instance
   * @param {string} secret - The secret token for authorization
   */
  constructor(secret) {
    if (!secret) throw new Error("secret is required");

    this.#secret = secret;
  }

  /**
   * Authorizes incoming requests by validating the authorization token.
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @returns {boolean} True if authorized, false otherwise
   */
  authorize(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    return token === this.#secret;
  }
}

/**
 * HTTP server for hosting an API extension using Copilot-LD.
 */
export class ApiExtension {
  #config;
  #client;
  #authorizer;
  #logger;
  #server;

  /**
   * Creates a new ApiExtension instance
   * @param {object} config - Extension configuration with llmToken
   * @param {object} client - Agent gRPC client for processing requests
   * @param {LocalSecretAuthorizer} authorizer - Authorizer instance
   * @param {import('@copilot-ld/libtelemetry').Logger} logger - Logger instance
   */
  constructor(config, client, authorizer, logger) {
    if (!config) throw new Error("config is required");
    if (!client) throw new Error("client is required");
    if (!authorizer) throw new Error("authorizer is required");
    if (!logger) throw new Error("logger is required");

    this.#config = config;
    this.#client = client;
    this.#authorizer = authorizer;
    this.#logger = logger;
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
   * Builds an AgentRequest object from the provided message and resource ID
   * @param {string} message - The user message content
   * @param {string|undefined} resourceId - The resource ID for conversation tracking
   * @returns {Promise<agent.AgentRequest>} The constructed agent request
   */
  async #buildAgentRequest(message, resourceId) {
    return agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({
          role: "user",
          content: message,
        }),
      ],
      llm_token: await this.#config.llmToken(),
      resource_id: resourceId,
    });
  }

  /**
   * Handles POST requests to /api/messages
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  async #handleApiMessages(req, res) {
    this.#logger.debug("Messages", "POST /api/messages");

    req.body = await parseJsonBody(req);

    const correlationId = req.body.correlationId || "unknown";
    const resourceId = req.body.resourceId;
    const message = req.body.message;

    if (!this.#authorizer.authorize(req)) {
      this.#logger.debug("Messages", "Unauthorized", { correlationId });
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized");
      return;
    }

    try {
      const requestParams = await this.#buildAgentRequest(message, resourceId);
      const response = await this.#client.ProcessUnary(requestParams);

      this.#logger.debug("Messages", "Completed", {
        correlationId,
        resourceId,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ reply: response }));
    } catch (err) {
      this.#logger.exception("Messages", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
      }
      res.end("Internal Server Error");
    }
  }

  /**
   * Creates and configures the HTTP server with route handling
   * @returns {http.Server} The configured HTTP server
   */
  #createHttpServer() {
    const routes = {
      "POST /api/messages": (req, res) => this.#handleApiMessages(req, res),
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
 * Creates and configures a new ApiExtension instance with dependencies
 * @param {object} client - Agent gRPC client for processing requests
 * @param {object} config - Extension configuration
 * @param {import('@copilot-ld/libtelemetry').Logger} logger - Logger instance
 * @returns {ApiExtension} Configured extension instance
 */
export function createApiExtension(client, config, logger) {
  const authorizer = new LocalSecretAuthorizer(config.secret);
  return new ApiExtension(config, client, authorizer, logger);
}
