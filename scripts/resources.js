/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { createLlm } from "@copilot-ld/libcopilot";
import { createPolicy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { ResourceProcessor } from "@copilot-ld/libresource/processor.js";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";

const config = await ScriptConfig.create("resources");

/**
 * Parse command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { selector: "[itemscope]" }; // default selector

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--selector" && i + 1 < args.length) {
      parsed.selector = args[i + 1];
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
  const configStorage = createStorage("config");
  const knowledgeStorage = createStorage("knowledge");
  const resourceStorage = createStorage("resources");
  const llm = createLlm(await config.githubToken());
  const logger = createLogger("script.resources");
  const policy = createPolicy();

  const resourceIndex = new ResourceIndex(resourceStorage, policy);
  const processor = new ResourceProcessor(
    resourceIndex,
    configStorage,
    knowledgeStorage,
    llm,
    logger,
  );
  await processor.processAssistants();
  await processor.processKnowledge(".html", [args.selector]);
}

main();
