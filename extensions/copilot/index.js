/* eslint-env node */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";

import { ExtensionConfig, ServiceConfig } from "@copilot-ld/libconfig";
import { createSecurityMiddleware } from "@copilot-ld/libweb";
import { logFactory } from "@copilot-ld/libutil";

import { clients } from "@copilot-ld/librpc";

// Extract generated clients
const { AgentClient } = clients;

/**
 * Creates a GitHub Copilot compatible extension
 * @param {import("@copilot-ld/agent").AgentClient} client - Agent service gRPC client
 * @param {(namespace: string) => import("@copilot-ld/libutil").Logger} [logFn] - Optional logger factory
 * @returns {Hono} Configured Hono application
 */
function createCopilotExtension(client, logFn = logFactory) {
  const app = new Hono();
  const logger = logFn("extension.copilot");

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
        await config.githubToken(),
      );

      // Extract messages and other parameters
      const { messages, user } = copilotRequest;

      // Process request through agent service
      // Ensure client is ready before making requests
      await client.ensureReady();

      const response = await client.ProcessRequest({
        messages: messages || [],
        github_token: copilotRequest.token || (await config.githubToken()),
        session_id: user?.login || undefined,
      });

      // Return response in Copilot-compatible format
      return c.json({
        choices: response.choices || [],
        usage: response.usage || {},
        session_id: response.session_id,
      });
    } catch (error) {
      logger.debug("Copilot extension error", {
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

const config = await ExtensionConfig.create("copilot");
const client = new AgentClient(await ServiceConfig.create("agent"));
const app = createCopilotExtension(client);

// Start server
serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    const logger = logFactory("extension.copilot");
    logger.debug("Listening on", { host: config.host, port: config.port });
  },
);
