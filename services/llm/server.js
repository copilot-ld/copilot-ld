/* eslint-env node */
import { Copilot } from "@copilot-ld/libcopilot";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { LlmService } from "./index.js";

// Start the service
const config = await ServiceConfig.create("llm", {
  model: "gpt-4o",
});

const service = new LlmService(
  config,
  (token, model) => new Copilot(token, model),
);
await service.start();
