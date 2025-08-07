/* eslint-env node */
import { Copilot } from "@copilot-ld/libcopilot";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { LlmService } from "./index.js";

// Start the service
const service = new LlmService(
  new ServiceConfig("llm", {
    model: "claude-3.5-sonnet",
  }),
  (token, model) => new Copilot(token, model),
);
await service.start();
