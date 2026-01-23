import { serve } from "@hono/node-server";

import { createExtensionConfig } from "@copilot-ld/libconfig";
import { createLogger } from "@copilot-ld/libtelemetry";

import { createUiExtension } from "./index.js";

// Initialize logging
const logger = createLogger("ui");

const uiConfig = await createExtensionConfig("ui");
const webConfig = await createExtensionConfig("web");

const app = await createUiExtension(webConfig, logger);

serve(
  {
    fetch: app.fetch,
    port: uiConfig.port,
    hostname: uiConfig.host,
  },
  () => {
    logger.debug("Server", "Listening", { url: uiConfig.url });
  },
);
