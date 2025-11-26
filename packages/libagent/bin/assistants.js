#!/usr/bin/env node
/* eslint-env node */
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";

import { AssistantProcessor } from "../processor/assistant.js";

/**
 * Process assistant configurations from assistants.yml and generate Assistant resources
 * using the AssistantProcessor
 * @returns {Promise<void>}
 */
async function main() {
  const configStorage = createStorage("config");
  const logger = createLogger("assistants");

  const resourceIndex = createResourceIndex("resources");

  // Process assistants using AssistantProcessor
  const assistantProcessor = new AssistantProcessor(
    resourceIndex,
    configStorage,
    logger,
  );
  await assistantProcessor.process();
}

main();
