import { Hono } from "hono";
import { streamText } from "hono/streaming";

import { createHtmlFormatter } from "@copilot-ld/libformat";
import { agent, common } from "@copilot-ld/libtype";
import {
  createValidationMiddleware,
  createCorsMiddleware,
  createAuthMiddleware,
} from "@copilot-ld/libweb";

// Create HTML formatter with factory function
const htmlFormatter = createHtmlFormatter();

/**
 * Creates a web extension with configurable dependencies
 * @param {import("@copilot-ld/librpc").clients.AgentClient} client - Agent service gRPC client
 * @param {import("@copilot-ld/libconfig").ExtensionConfig} config - Extension configuration
 * @param {(namespace: string) => import("@copilot-ld/libtelemetry").Logger} [logger] - Optional logger
 * @returns {Promise<Hono>} Configured Hono application
 */
export async function createWebExtension(client, config, logger = null) {
  const app = new Hono();

  // Debug log auth configuration
  logger?.debug("Config", "Auth configuration", {
    authEnabled: config.auth_enabled,
    authEnabledType: typeof config.auth_enabled,
    jwtSecret: config.jwtSecret ? "present" : "missing",
  });

  // Create middleware instances
  const validationMiddleware = createValidationMiddleware(config);
  const corsMiddleware = createCorsMiddleware(config);

  // Create auth middleware if enabled (auth_enabled from config.json or EXTENSIONS_WEB_AUTH_ENABLED)
  const authMiddleware = config.auth_enabled
    ? createAuthMiddleware(config)
    : null;

  // Add CORS middleware
  app.use(
    "/web/api/*",
    corsMiddleware.create({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      allowMethods: ["GET", "POST"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Add auth middleware to protected routes
  if (authMiddleware) {
    app.use("/web/api/chat", authMiddleware.create());
  }

  // Health check endpoint
  app.get("/web/health", (c) => {
    return c.json({ status: "ok" });
  });

  // Proxy Supabase Auth to avoid CORS issues
  app.all("/web/auth/:path{.+}", async (c) => {
    const origin = c.req.header("origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, apikey, x-client-info, x-supabase-api-version",
      "Access-Control-Allow-Credentials": "true",
    };

    // Handle preflight
    if (c.req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const path = c.req.param("path");
      // Supabase client adds /auth/v1/ prefix, strip it to get actual GoTrue endpoint
      const endpoint = path.replace(/^auth\/v1\//, "");
      const supabaseUrl =
        process.env.SUPABASE_AUTH_URL || "http://localhost:9999";
      const query = new URL(c.req.url).search;
      const url = `${supabaseUrl}/${endpoint}${query}`;

      logger?.debug("AuthProxy", "Proxying request", { path, endpoint, url });

      const headers = {};
      c.req.raw.headers.forEach((value, key) => {
        if (
          !["host", "connection", "content-length"].includes(key.toLowerCase())
        ) {
          headers[key] = value;
        }
      });

      const options = {
        method: c.req.method,
        headers,
      };

      if (c.req.method !== "GET" && c.req.method !== "HEAD") {
        options.body = await c.req.text();
      }

      const response = await fetch(url, options);
      const body = await response.text();
      const responseHeaders = new Headers(corsHeaders);
      response.headers.forEach((value, key) => {
        // Skip CORS headers from upstream - we set our own
        if (!key.toLowerCase().startsWith("access-control-")) {
          responseHeaders.set(key, value);
        }
      });

      return new Response(body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      logger?.error("AuthProxy", "Proxy error", { error: error.message });
      return c.json({ error: error.message }, 500);
    }
  });

  // Route handlers with input validation
  app.post(
    "/web/api/chat",
    validationMiddleware.create({
      required: ["message"],
      types: {
        message: "string",
        resource_id: "string",
      },
      maxLengths: {
        message: 5000,
        resource_id: 100,
      },
    }),
    async (c) => {
      try {
        // Access authenticated user (null if auth disabled or optional)
        const user = c.get("user");
        logger?.debug("Chat", "Processing request", { userId: user?.id });

        const data = c.get("validatedData");
        const { message, resource_id } = data;

        const requestParams = agent.AgentRequest.fromObject({
          messages: [
            common.Message.fromObject({ role: "user", content: message }),
          ],
          llm_token: await config.llmToken(),
          resource_id: resource_id,
        });

        return streamText(c, async (stream) => {
          try {
            const grpcStream = client.ProcessStream(requestParams);

            for await (const chunk of grpcStream) {
              if (chunk.resource_id) {
                await stream.write(
                  JSON.stringify({ resource_id: chunk.resource_id }) + "\n",
                );
              }

              if (chunk.messages && chunk.messages.length > 0) {
                for (const msg of chunk.messages) {
                  let content = msg.content || "";
                  if (msg.role === "assistant" && content) {
                    content = htmlFormatter.format(content);
                  }

                  await stream.write(
                    JSON.stringify({
                      messages: [
                        {
                          role: msg.role,
                          content: content,
                          tool_calls: msg.tool_calls,
                        },
                      ],
                    }) + "\n",
                  );
                }
              }
            }
          } catch (error) {
            logger?.error("Stream", error);
            await stream.write(
              JSON.stringify({
                error: "Stream processing failed",
                details: error.message,
              }) + "\n",
            );
          }
        });
      } catch (error) {
        logger?.error("API", error, { path: c.req.path });

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
