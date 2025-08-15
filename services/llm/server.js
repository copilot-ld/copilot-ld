/* eslint-env node */
import { Copilot } from "@copilot-ld/libcopilot";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { LlmService } from "./index.js";

// Start the service
const config = await ServiceConfig.create("llm", {
  model: "claude-3.5-sonnet",
});

const service = new LlmService(
  config,
  (token, model) => new Copilot(token, model),
);
await service.start();
