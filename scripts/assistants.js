/* eslint-env node */
import { createPolicy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";

import { AssistantProcessor } from "../packages/libagent/processor.js";

/**
 * Process assistant configurations from assistants.yml and generate Assistant resources
 * using the AssistantProcessor
 * @returns {Promise<void>}
 */
async function main() {
  const configStorage = createStorage("config");
  const resourceStorage = createStorage("resources");
  const logger = createLogger("script.assistants");
  const policy = createPolicy();

  const resourceIndex = new ResourceIndex(resourceStorage, policy);

  // Process assistants using AssistantProcessor
  const assistantProcessor = new AssistantProcessor(
    resourceIndex,
    configStorage,
    logger,
  );
  await assistantProcessor.process();
}

main();
