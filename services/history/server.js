/* eslint-env node */
import { llmFactory } from "@copilot-ld/libcopilot";
import { PromptOptimizer, PromptStorage } from "@copilot-ld/libprompt";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { HistoryService } from "./index.js";

// Start the service
const config = new ServiceConfig("history", {
  historyTokens: 4000,
});

const storage = config.storage(config.storagePath("history"));
const promptStorage = new PromptStorage(storage);
const promptOptimizer = new PromptOptimizer(llmFactory, {
  totalTokenLimit: config.historyTokens || 100000,
});

const service = new HistoryService(config, promptStorage, promptOptimizer);
await service.start();
