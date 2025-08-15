/* eslint-env node */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { createHtmlFormatter } from "@copilot-ld/libformat";
import { ExtensionConfig, ServiceConfig } from "@copilot-ld/libconfig";
import { Client } from "@copilot-ld/libservice";
import { createSecurityMiddleware } from "@copilot-ld/libweb";

// Create HTML formatter with factory function
const htmlFormatter = createHtmlFormatter();

/**
 * Creates a web extension with configurable dependencies
 * @param {Client} client - Agent service gRPC client
 * @param {ExtensionConfig} config - Extension configuration
 * @returns {Promise<Hono>} Configured Hono application
 */
async function createWebExtension(client, config) {
  const app = new Hono();

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
  // TODO: Decouple the web extension from the example at extensions/web/public
  app.use("/*", serveStatic({ root: "public" }));

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
          github_token: await config.githubToken(),
        };

        if (session_id) {
          requestParams.session_id = session_id;
        }

        // Ensure client is ready before making requests
        await client.ensureReady();

        const response = await client.ProcessRequest(requestParams);

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
const config = await ExtensionConfig.create("web");
const client = new Client(await ServiceConfig.create("agent"));
const app = await createWebExtension(client, config);

// Start server
serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    console.log(`Listening on: ${config.host}:${config.port}`);
  },
);
