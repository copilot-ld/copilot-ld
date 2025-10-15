/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { createLlm } from "@copilot-ld/libcopilot";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";

import { ResourceProcessor } from "@copilot-ld/libresource/processor.js";
import { DescriptorProcessor } from "@copilot-ld/libresource/descriptor.js";

const config = await ScriptConfig.create("resources");

/**
 * Parse command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { base: null }; // default selector and no base IRI

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base" && i + 1 < args.length) {
      parsed.base = args[i + 1];
      i++; // skip the next argument as it's the value
    }
  }

  return parsed;
}

/**
 * Process all HTML files in the knowledge base directory and generate resources
 * using the ResourceProcessor
 * @returns {Promise<void>}
 */
async function main() {
  const args = parseArgs();
  const knowledgeStorage = createStorage("knowledge");

  const llm = createLlm(await config.githubToken(), "gpt-4o-mini");
  const logger = createLogger("resources");

  const resourceIndex = createResourceIndex();
  const descriptorProcessor = new DescriptorProcessor(llm);

  // Process knowledge using ResourceProcessor
  const resourceProcessor = new ResourceProcessor(
    resourceIndex,
    knowledgeStorage,
    descriptorProcessor,
    logger,
    args.base,
  );
  await resourceProcessor.process(".html");
}

main();
