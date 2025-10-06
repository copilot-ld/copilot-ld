/* eslint-env node */
import { Hono } from "hono";
import { verifyAndParseRequest } from "@copilot-extensions/preview-sdk";

import { createSecurityMiddleware } from "@copilot-ld/libweb";
import { logFactory } from "@copilot-ld/libutil";

/**
 * Creates a GitHub Copilot compatible extension
 * @param {import("@copilot-ld/librpc").clients.AgentClient} client - Agent service gRPC client
 * @param {import("@copilot-ld/libconfig").ExtensionConfig} config - Extension configuration
 * @param {(namespace: string) => import("@copilot-ld/libutil").Logger} [logFn] - Optional logger factory
 * @returns {Hono} Configured Hono application
 */
export function createCopilotExtension(client, config, logFn = logFactory) {
  const app = new Hono();
  const logger = logFn("extension.copilot");

  // Create security middleware with config
  const security = createSecurityMiddleware(config);

  // Add security middleware
  app.use("/copilot/*", security.createErrorMiddleware());
  app.use("/copilot/api/*", security.createRateLimitMiddleware());
  app.use(
    "/copilot/api/*",
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
    "/copilot/",
    security.createValidationMiddleware({
      required: [],
      types: {},
      maxLengths: {},
    }),
  );

  // Route handlers
  app.get("/copilot/", (c) => {
    return c.json({
      message: "GitHub Copilot Extension",
      status: "ready",
    });
  });

  app.post("/copilot/", async (c) => {
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
