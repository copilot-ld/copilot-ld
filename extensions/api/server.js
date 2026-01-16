import { createExtensionConfig } from "@copilot-ld/libconfig";
import { createClient, createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { createApiExtension } from "./index.js";

// Initialize observability
const logger = createLogger("api");
const tracer = await createTracer("api");

// Extension configuration
const config = await createExtensionConfig("api");

const client = await createClient("agent", logger, tracer);
const extension = createApiExtension(client, config, logger);

extension.listen(config.port, () => {
  logger.debug("Server", "Listening", {
    uri: `http://localhost:${config.port}`,
  });
});
