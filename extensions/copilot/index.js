/* eslint-env node */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";

import { ExtensionConfig } from "@copilot-ld/libconfig";
import { Client } from "@copilot-ld/libservice";
import { createSecurityMiddleware, AgentClient } from "@copilot-ld/libweb";

// Configuration and initialization
const config = new ExtensionConfig("copilot");

/**
 * Creates a copilot extension with configurable dependencies
 * @param {AgentClient} agentClient - Agent service client wrapper
 * @returns {Hono} Configured Hono application
 */
function createCopilotExtension(agentClient) {
  const app = new Hono();

  // Create security middleware with config
  const security = createSecurityMiddleware(config);

  // Add security middleware
  app.use("*", security.createErrorMiddleware());
  app.use("/api/*", security.createRateLimitMiddleware());
  app.use(
    "/api/*",
    security.createCorsMiddleware({
      origin: [
        "https://github.com",
        "https://copilot-workspace.githubassets.com",
      ],
      allowMethods: ["GET", "POST"],
      allowHeaders: ["Content-Type", "X-GitHub-Token", "Authorization"],
    }),
  );

  // Add input validation for POST requests
  app.use(
    "/",
    security.createValidationMiddleware({
      required: [],
      types: {},
      maxLengths: {},
    }),
  );

  // Route handlers
  app.get("/", (c) => {
    return c.json({
      message: "GitHub Copilot Extension",
      status: "ready",
    });
  });

  app.post("/", async (c) => {
    try {
      // Verify and parse the Copilot request using the SDK
      const copilotRequest = await verifyAndParseRequest(
        c.req.raw,
        config.githubToken(),
      );

      // Extract messages and other parameters
      const { messages, user } = copilotRequest;

      // Process request through agent service
      const response = await agentClient.processRequest({
        messages: messages || [],
        github_token: copilotRequest.token || config.githubToken(),
        session_id: user?.login || undefined,
      });

      // Return response in Copilot-compatible format
      return c.json({
        choices: response.choices || [],
        usage: response.usage || {},
        session_id: response.session_id,
      });
    } catch (error) {
      console.error("Copilot extension error:", {
        error: error.message,
        path: c.req.path,
      });

      // Return appropriate error response
      if (
        error.message.includes("verification") ||
        error.message.includes("authentication")
      ) {
        return c.json({ error: "Authentication failed" }, 401);
      }

      if (
        error.message.includes("parse") ||
        error.message.includes("invalid")
      ) {
        return c.json({ error: "Invalid request format" }, 400);
      }

      return c.json({ error: "Internal server error" }, 500);
    }
  });

  return app;
}

// Create and start the application
let agentClient;
try {
  if (!process.env.SERVICE_AUTH_SECRET) {
    console.error(
      "Warning: SERVICE_AUTH_SECRET is not set. Extension will not work without authentication.",
    );
    console.error("Please set SERVICE_AUTH_SECRET in your .env file.");
  }

  const grpcClient = new Client("agent");
  agentClient = new AgentClient(grpcClient);
} catch (error) {
  console.error("Failed to initialize agent client:", error.message);
  process.exit(1);
}

const app = createCopilotExtension(agentClient);

// Start server
serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    console.log(
      `Copilot extension listening on: ${config.host}:${config.port}`,
    );
  },
);
