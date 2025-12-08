import http from "node:http";
import { clients } from "@copilot-ld/librpc";
import { agent, common } from "@copilot-ld/libtype";
import { createLogger } from "@copilot-ld/libtelemetry";
import { LocalSecretAuthorizer } from "./auth.js";
import { parseBody } from "./http.js";

/**
 * HTTP server for hosting a API extension using Copilot-LD.
 */
export class Server {
  #agentConfig;
  #agentClient;
  #authorizer;
  #logger;
  #server;

  /**
   * Creates a new apiServer instance
   * @param {object} agentConfig - Service configuration
   * @param {object} agentClient - Agent client for processing requests
   * @param {import('./auth.js').LocalSecretAuthorizer} authorizer - Authorizer instance
   * @param {object} logger - Logger instance
   */
  constructor(agentConfig, agentClient, authorizer, logger) {
    if (!agentConfig) throw new Error("agentConfig is required");
    if (!agentClient) throw new Error("agentClient is required");
    if (!authorizer) throw new Error("authorizer is required");
    if (!logger) throw new Error("logger is required");

    this.#agentConfig = agentConfig;
    this.#agentClient = agentClient;
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
      github_token: await this.#agentConfig.githubToken(),
      resource_id: resourceId,
    });
  }

  /**
   * Handles POST requests to /api/messages for Bot Framework protocol
   * @param {import('http').IncomingMessage} req - HTTP request object
   * @param {import('http').ServerResponse} res - HTTP response object
   */
  async #handleApiMessages(req, res) {
    this.#logger.debug("handleApiMessages", "POST /api/messages");

    req.body = await parseBody(req);

    const correlationId = req.body.correlationId || "unknown";
    const resourceId = req.body.resourceId;
    const message = req.body.message;

    if (!this.#authorizer.authorize(req)) {
      this.#logger.debug(
        "handleApiMessages",
        "Unauthorized request to /api/messages for correlationId",
        { correlationId },
      );
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Unauthorized");
      return;
    }

    try {
      const requestParams = await this.#buildAgentRequest(message, resourceId);
      const response = await this.#agentClient.ProcessRequest(requestParams);

      this.#logger.debug("handleApiMessages", "Request completed", {
        correlationId,
        resourceId,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ reply: response }));
    } catch (err) {
      this.#logger.error("handleApiMessages", err);
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
 * Creates and configures a new apiServer instance
 * @param {object} agentConfig - Service configuration
 * @param {object} extensionConfig - Extension configuration
 * @param {object} agentClient - Agent client for processing requests
 * @param {import('./auth.js').LocalSecretAuthorizer} authorizer - Authorizer instance
 * @param {object} logger - Logger instance (optional, creates default if not provided)
 * @returns {Server} Configured server instance
 */
export default function createServer(
  agentConfig,
  extensionConfig,
  agentClient,
  authorizer,
  logger,
) {
  if (!logger) {
    logger = createLogger("api");
  }
  if (!agentClient) {
    agentClient = new clients.AgentClient(agentConfig);
  }
  if (!authorizer) {
    authorizer = new LocalSecretAuthorizer(extensionConfig.secret);
  }
  return new Server(agentConfig, agentClient, authorizer, logger);
}
