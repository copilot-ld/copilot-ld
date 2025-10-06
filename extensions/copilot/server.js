/* eslint-env node */
import { serve } from "@hono/node-server";
import { ExtensionConfig, ServiceConfig } from "@copilot-ld/libconfig";
import { logFactory } from "@copilot-ld/libutil";
import { clients } from "@copilot-ld/librpc";
import { createCopilotExtension } from "./index.js";

const { AgentClient } = clients;

const config = await ExtensionConfig.create("copilot");
const client = new AgentClient(await ServiceConfig.create("agent"));
const app = createCopilotExtension(client, config);

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  () => {
    const logger = logFactory("copilot");
    logger.debug("Listening on", { host: config.host, port: config.port });
  },
);
