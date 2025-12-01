import http from "node:http";
import { clients } from "@copilot-ld/librpc";
import { agent, common } from "@copilot-ld/libtype";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { parseBody } from "./http.js";

const config = await createServiceConfig("agent");
const agentClient = new clients.AgentClient(config);

/**
 * Authorizes incoming requests by validating the authorization token.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @returns {boolean} True if authorized, false otherwise
 */
function authorize(req) {
  const authHeader = req.headers.authorization;
  const secret = process.env.TEAMS_AGENT_SECRET;

  if (!secret) {
    console.error("TEAMS_AGENT_SECRET environment variable not set");
    return false;
  }

  if (!authHeader) {
    return false;
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === secret;
}

/**
 * Handles POST requests to /api/messages for Bot Framework protocol.
 * @param {import('http').IncomingMessage} req - HTTP request object
 * @param {import('http').ServerResponse} res - HTTP response object
 */
async function handleApiMessages(req, res) {
  if (!authorize(req)) {
    console.warn("Unauthorized request to /api/messages");
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end("Unauthorized");
    return;
  }
  console.log("POST /api/messages");
  req.body = await parseBody(req);

  const tenantId = req.body.tenantId;
  const recipientId = req.body.recipientId;
  const tenantRecipientKey = `${tenantId}:${recipientId}`;
  const resourceId = req.body.resourceId;
  const message = req.body.message;

  try {
    const requestParams = agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({
          role: "user",
          content: message,
        }),
      ],
      github_token: await config.githubToken(),
      resource_id: resourceId,
    });

    console.log(
      "Processing request with agentClient for recipient:",
      tenantRecipientKey,
    );

    const response = await agentClient.ProcessRequest(requestParams);
    console.log(`Request completed for recipient: ${tenantRecipientKey}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ reply: response }));
  } catch (err) {
    console.error("Error in agentClient.ProcessRequest:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
    }
    res.end("Internal Server Error");
  }
}

/**
 * Creates and configures a native HTTP server for hosting a Microsoft Teams bot using Copilot-LD.
 * Sets up HTTP endpoints for chat UI, bot message processing, and streaming connections.
 * @returns {Promise<http.Server>} Configured HTTP server instance.
 */
export default async function createServer() {
  // Route map for all endpoints
  const routes = {
    "POST /api/messages": (req, res) => handleApiMessages(req, res),
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
