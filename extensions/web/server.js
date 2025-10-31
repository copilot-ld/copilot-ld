/* eslint-env node */
import { serve } from "@hono/node-server";
import {
  createExtensionConfig,
  createServiceConfig,
} from "@copilot-ld/libconfig";
import { createLogger } from "@copilot-ld/libutil";
import { clients } from "@copilot-ld/librpc";
import { createWebExtension } from "./index.js";

const { AgentClient } = clients;

const config = await createExtensionConfig("web");
const client = new AgentClient(await createServiceConfig("agent"));
const app = await createWebExtension(client, config);

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    const logger = createLogger("web");
    logger.debug("Listening on", { host: config.host, port: config.port });
  },
);
