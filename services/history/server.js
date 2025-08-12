/* eslint-env node */
import NodeCache from "node-cache";

import { llmFactory } from "@copilot-ld/libcopilot";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { HistoryService } from "./index.js";

// Start the service
const config = new ServiceConfig("history", {
  ttl: 3600,
  checkperiod: 600,
  historyTokens: 4000,
});
const service = new HistoryService(
  config,
  new NodeCache({
    stdTTL: config.ttl,
    checkperiod: config.checkperiod,
    useClones: false,
  }),
  llmFactory,
);
await service.start();
