import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Creates a UI extension
 * @param {import("@copilot-ld/libconfig").ExtensionConfig} config - Extension configuration
 * @param {(namespace: string) => import("@copilot-ld/libtelemetry").Logger} [_logger] - Optional logger
 * @returns {Promise<Hono>} Configured Hono application
 */
export async function createUiExtension(config, _logger = null) {
  const app = new Hono();

  // Health check endpoint
  app.get("/ui/health", (c) => {
    return c.json({ status: "ok" });
  });

  // Serve runtime configuration
  app.get("/ui/config.js", (c) => {
    return c.text(`window.ENV = { API_URL: "${config.apiUrl}" };`, 200, {
      "Content-Type": "application/javascript",
    });
  });

  // Serve chat components from libchat package (development)
  app.use(
    "/ui/libchat/*",
    serveStatic({
      root: join(__dirname, "../../packages/libchat"),
      rewriteRequestPath: (path) => path.replace(/^\/ui\/libchat/, ""),
    }),
  );

  // Serve static files
  app.use("/ui/*", serveStatic({ root: "public" }));

  return app;
}
