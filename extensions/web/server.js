import { serve } from "@hono/node-server";

import { createExtensionConfig } from "@copilot-ld/libconfig";
import { createClient, createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { createWebExtension } from "./index.js";

// Initialize observability
const logger = createLogger("web");
const tracer = await createTracer("web");

// Extension configuration
const config = await createExtensionConfig("web");

const client = await createClient("agent", logger, tracer);
const app = await createWebExtension(client, config, logger);

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
