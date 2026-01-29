import { serve } from "@hono/node-server";

import { createExtensionConfig } from "@copilot-ld/libconfig";
import { createClient, createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { createWebExtension } from "./index.js";

// Initialize observability
const logger = createLogger("web");
const tracer = await createTracer("web");

// Extension configuration with defaults
const config = await createExtensionConfig("web", { auth_enabled: false });

// Create gRPC clients
const agentClient = await createClient("agent", logger, tracer);
const learnClient = await createClient("learn", logger, tracer).catch(() => {
  logger.warn("Client", "Learn service unavailable, feedback disabled");
  return null;
});

const app = await createWebExtension(
  { agent: agentClient, learn: learnClient },
  config,
  logger,
);

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    logger.debug("Server", "Listening", {
      uri: `${config.host}:${config.port}`,
    });
  },
);
