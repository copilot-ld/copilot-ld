/* eslint-env node */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { createHtmlFormatter } from "@copilot-ld/libformat";
import { ExtensionConfig, ServiceConfig } from "@copilot-ld/libconfig";
import { Client } from "@copilot-ld/libservice";
import { createSecurityMiddleware, AgentClient } from "@copilot-ld/libweb";

// Configuration and initialization
const config = new ExtensionConfig("web");

// Create HTML formatter with factory function
const htmlFormatter = createHtmlFormatter();

/**
 * Creates a web extension with configurable dependencies
 * @param {AgentClient} agentClient - Agent service client wrapper
 * @returns {Hono} Configured Hono application
 */
function createWebExtension(agentClient) {
  const app = new Hono();

  // Create a Config instance for accessing paths
  const config = new ExtensionConfig("web");

  // Create security middleware with config
  const security = createSecurityMiddleware(config);

  // Add security middleware
  app.use("*", security.createErrorMiddleware());
  app.use("/api/*", security.createRateLimitMiddleware());
  app.use(
    "/api/*",
    security.createCorsMiddleware({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      allowMethods: ["GET", "POST"],
      allowHeaders: ["Content-Type"],
    }),
  );

  // Serve static files
  app.use("/*", serveStatic({ root: config.publicPath() }));

  // Route handlers with input validation
  app.post(
    "/api/chat",
    security.createValidationMiddleware({
      required: ["message"],
      types: {
        message: "string",
        session_id: "string",
      },
      maxLengths: {
        message: 5000,
        session_id: 100,
      },
    }),
    async (c) => {
      try {
        const data = c.get("validatedData");
        const { message, session_id } = data;

        const requestParams = {
          messages: [{ role: "user", content: message }],
          github_token: config.githubToken(),
        };

        if (session_id) {
          requestParams.session_id = session_id;
        }

        const response = await agentClient.processRequest(requestParams);

        // Format HTML content if present
        if (
          response.choices &&
          response.choices.length > 0 &&
          response.choices[0].message &&
          response.choices[0].message.content
        ) {
          response.choices[0].message.content = htmlFormatter.format(
            response.choices[0].message.content,
          );
        }

        return c.json({
          ...response,
          status: "success",
        });
      } catch (error) {
        console.error("Web extension error:", {
          error: error.message,
          path: c.req.path,
        });

        // Return sanitized error response
        return c.json(
          {
            error: "Request processing failed",
            status: "error",
          },
          500,
        );
      }
    },
  );

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

  const grpcClient = new Client(new ServiceConfig("agent"));
  agentClient = new AgentClient(grpcClient);
} catch (error) {
  console.error("Failed to initialize agent client:", error.message);
  process.exit(1);
}

const app = createWebExtension(agentClient);

// Start server
serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    console.log(`Web extension listening on: ${config.host}:${config.port}`);
  },
);
