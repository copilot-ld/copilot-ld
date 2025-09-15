/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { Copilot } from "@copilot-ld/libcopilot";

import { LlmService } from "./index.js";

// Bootstrap the service
const config = await ServiceConfig.create("llm", {
  model: "gpt-4o",
});

const service = new LlmService(
  config,
  (token, model) => new Copilot(token, model),
);

// Create and start the server
const server = new Server(service, config);

await server.start();
