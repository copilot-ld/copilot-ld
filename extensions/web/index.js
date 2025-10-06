/* eslint-env node */
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { createHtmlFormatter } from "@copilot-ld/libformat";
import { createSecurityMiddleware } from "@copilot-ld/libweb";
import { logFactory } from "@copilot-ld/libutil";
import { agent, common } from "@copilot-ld/libtype";

// Create HTML formatter with factory function
const htmlFormatter = createHtmlFormatter();

/**
 * Creates a web extension with configurable dependencies
 * @param {import("@copilot-ld/librpc").clients.AgentClient} client - Agent service gRPC client
 * @param {import("@copilot-ld/libconfig").ExtensionConfig} config - Extension configuration
 * @param {(namespace: string) => import("@copilot-ld/libutil").Logger} [logFn] - Optional logger factory
 * @returns {Promise<Hono>} Configured Hono application
 */
export async function createWebExtension(client, config, logFn = logFactory) {
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

  // Health check endpoint
  app.get("/web/health", (c) => {
    return c.json({ status: "ok" });
  });

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
