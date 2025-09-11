/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { ToolService } from "./index.js";

// Bootstrap the service
const config = await ServiceConfig.create("tool", {
  endpoints: {},
});

const service = new ToolService(config);

// Create and start the server
const server = new Server(service, config);

await server.start();
