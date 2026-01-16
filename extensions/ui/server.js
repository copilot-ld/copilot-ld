import { serve } from "@hono/node-server";

import { createExtensionConfig } from "@copilot-ld/libconfig";
import { createLogger } from "@copilot-ld/libtelemetry";

import { createUiExtension } from "./index.js";

// Initialize observability
const logger = createLogger("ui");

// Extension configuration
const config = await createExtensionConfig("ui", {
  apiUrl: process.env.EXTENSION_WEB_URL || "/web/api",
});

const app = await createUiExtension(config, logger);

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
