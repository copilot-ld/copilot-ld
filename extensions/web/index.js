/* eslint-env node */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { createHtmlFormatter } from "@copilot-ld/libformat";
import { ExtensionConfig, ServiceConfig } from "@copilot-ld/libconfig";
import { createSecurityMiddleware } from "@copilot-ld/libweb";
import { logFactory } from "@copilot-ld/libutil";
import { agent, common } from "@copilot-ld/libtype";

import { clients } from "@copilot-ld/librpc";

// Extract generated clients
const { AgentClient } = clients;

// Create HTML formatter with factory function
const htmlFormatter = createHtmlFormatter();

/**
 * Creates a web extension with configurable dependencies
 * @param {AgentClient} client - Agent service gRPC client
 * @param {ExtensionConfig} config - Extension configuration
 * @param {(namespace: string) => import("@copilot-ld/libutil").Logger} [logFn] - Optional logger factory
 * @returns {Promise<Hono>} Configured Hono application
 */
async function createWebExtension(client, config, logFn = logFactory) {
  const app = new Hono();
  const logger = logFn("extension.web");

  // Create security middleware with config
  const security = createSecurityMiddleware(config);

  // Add security middleware
  app.use("/web/*", security.createErrorMiddleware());
  app.use("/web/api/*", security.createRateLimitMiddleware());
  app.use(
    "/web/api/*",
    security.createCorsMiddleware({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      allowMethods: ["GET", "POST"],
      allowHeaders: ["Content-Type"],
    }),
  );

  // Serve static files
  // TODO: Decouple the web extension from the example at extensions/web/public
  app.use("/web/*", serveStatic({ root: "public" }));

  // Route handlers with input validation
  app.post(
    "/web/api/chat",
    security.createValidationMiddleware({
      required: ["message"],
      types: {
        message: "string",
        conversation_id: "string",
      },
      maxLengths: {
        message: 5000,
        conversation_id: 100,
      },
    }),
    async (c) => {
      try {
        const data = c.get("validatedData");
        const { message, conversation_id } = data;

        const requestParams = agent.AgentRequest.fromObject({
          messages: [
            common.MessageV2.fromObject({ role: "user", content: message }),
          ],
          github_token: await config.githubToken(),
          conversation_id: conversation_id,
        });

        // Ensure client is ready before making requests
        await client.ensureReady();

        const response = await client.ProcessRequest(requestParams);
        let reply = { role: "assistant", content: null };

        // Format HTML content if present
        if (
          response.choices?.length > 0 &&
          response.choices[0]?.message?.content
        ) {
          reply.content = htmlFormatter.format(
            String(response.choices[0].message.content),
          );
        }

        return c.json({
          message: reply,
          status: "success",
        });
      } catch (error) {
        logger.debug("Web extension error", {
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
const client = new AgentClient(await ServiceConfig.create("agent"));
const app = await createWebExtension(client, config);

// Start server
serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    const logger = logFactory("extension.web");
    logger.debug("Listening on", { host: config.host, port: config.port });
  },
);
