/* eslint-env node */
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { createHtmlFormatter } from "@copilot-ld/libformat";
import {
  createValidationMiddleware,
  createCorsMiddleware,
} from "@copilot-ld/libweb";
import { createLogger } from "@copilot-ld/libutil";
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
export async function createWebExtension(client, config, logFn = createLogger) {
  const app = new Hono();
  const logger = logFn("web");

  // Create middleware instances
  const validationMiddleware = createValidationMiddleware(config);
  const corsMiddleware = createCorsMiddleware(config);

  // Add CORS middleware
  app.use(
    "/web/api/*",
    corsMiddleware.create({
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
    validationMiddleware.create({
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
            common.Message.fromObject({ role: "user", content: message }),
          ],
          github_token: await config.githubToken(),
          conversation_id: conversation_id,
        });

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
