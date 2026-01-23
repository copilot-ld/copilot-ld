import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Creates the UI extension - a demo frontend for Copilot-LD.
 *
 * This extension serves:
 * - Static HTML/JS/CSS files from /public
 * - Runtime configuration at /ui/config.js
 * - Auth proxy at /ui/auth/* (forwards to Supabase GoTrue)
 * - Development assets from libchat package
 * @param {import("@copilot-ld/libconfig").ExtensionConfig} config - Extension configuration
 * @param {import("@copilot-ld/libtelemetry").Logger} [logger] - Optional logger
 * @returns {Promise<Hono>} Configured Hono application
 */
export async function createUiExtension(config, logger = null) {
  const app = new Hono();

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------

  app.get("/ui/health", (c) => c.json({ status: "ok" }));

  // ---------------------------------------------------------------------------
  // Runtime Configuration
  // Provides environment-specific URLs to the frontend JavaScript.
  // Loaded by HTML pages via: <script src="/ui/config.js"></script>
  // Sets meta tags for main.js to read.
  // ---------------------------------------------------------------------------

  app.get("/ui/config.js", (c) => {
    const origin = buildOrigin(c, config);

    // Configuration is injected into meta tags by this script
    const js = `
(function() {
  const chatUrl = "${config.url}";
  const authUrl = "${origin}/ui/auth";
  const anonKey = "${config.jwtAnonKey() || ""}";
  
  document.querySelector('meta[name="chat-url"]')?.setAttribute("content", chatUrl);
  document.querySelector('meta[name="auth-url"]')?.setAttribute("content", authUrl);
  document.querySelector('meta[name="anon-key"]')?.setAttribute("content", anonKey);
})();
`.trim();
    return c.text(js, 200, {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
  });

  // ---------------------------------------------------------------------------
  // Auth Proxy
  // Forwards requests to GoTrue auth service to avoid CORS issues.
  // GoTrue endpoints: /token, /user, /signup, /logout, etc.
  // ---------------------------------------------------------------------------

  app.all("/ui/auth/:path{.+}", async (c) => {
    return proxyAuthRequest(c, config, logger);
  });

  // ---------------------------------------------------------------------------
  // Static Files
  // ---------------------------------------------------------------------------

  // Development: serve libchat components directly from package
  app.use(
    "/ui/libchat/*",
    serveStatic({
      root: join(__dirname, "../../packages/libchat"),
      rewriteRequestPath: (path) => path.replace(/^\/ui\/libchat/, ""),
    }),
  );

  // Serve static files from /public/ui/*
  app.use("/ui/*", serveStatic({ root: "public" }));

  return app;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Builds the origin URL from the request, respecting proxy headers.
 * @param {import("hono").Context} c - Hono context
 * @param {import("@copilot-ld/libconfig").ExtensionConfig} config - Config fallback
 * @returns {string} Origin URL (e.g., "http://localhost:3000")
 */
function buildOrigin(c, config) {
  const protocol = c.req.header("x-forwarded-proto") || "http";
  const host = c.req.header("host") || new URL(config.url).host;
  return `${protocol}://${host}`;
}

/**
 * Proxies authentication requests to the upstream GoTrue auth service.
 * @param {import("hono").Context} c - Hono context
 * @param {import("@copilot-ld/libconfig").ExtensionConfig} config - Extension config
 * @param {import("@copilot-ld/libtelemetry").Logger} [logger] - Optional logger
 * @returns {Promise<Response>} Proxied auth response or CORS preflight response
 */
async function proxyAuthRequest(c, config, logger) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": c.req.header("origin") || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Allow-Credentials": "true",
  };

  // Handle CORS preflight
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get the path after /ui/auth/
    const path = c.req.param("path");

    // Build upstream URL
    const query = new URL(c.req.url).search;
    const upstreamUrl = `${config.jwtAuthUrl()}/${path}${query}`;

    logger?.debug("AuthProxy", "Forwarding", { path, upstreamUrl });

    // Forward request headers (except hop-by-hop headers)
    const headers = {};
    c.req.raw.headers.forEach((value, key) => {
      const skip = ["host", "connection", "content-length"];
      if (!skip.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    // Build fetch options
    const fetchOptions = { method: c.req.method, headers };
    if (!["GET", "HEAD"].includes(c.req.method)) {
      fetchOptions.body = await c.req.text();
    }

    // Execute upstream request
    const response = await fetch(upstreamUrl, fetchOptions);
    const body = await response.text();

    // Build response with CORS headers
    const responseHeaders = new Headers(corsHeaders);
    response.headers.forEach((value, key) => {
      // Use our CORS headers, not upstream's
      if (!key.toLowerCase().startsWith("access-control-")) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    logger?.error("AuthProxy", "Request failed", { error: error.message });
    return c.json({ error: error.message }, 500);
  }
}
