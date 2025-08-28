/* eslint-env node */
import { ToolConfig } from "@copilot-ld/libconfig";
import { llmFactory } from "@copilot-ld/libcopilot";
import { policyFactory } from "@copilot-ld/libpolicy";
import { ResourceIndex, ResourceProcessor } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

const config = await ToolConfig.create("resources");

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
 * Main function to process all HTML files in the knowledge base directory
 * and generate resources using the ResourceProcessor
 * @returns {Promise<void>}
 */
async function main() {
  const args = parseArgs();
  const configStorage = storageFactory("config");
  const knowledgeStorage = storageFactory("knowledge");
  const resourceStorage = storageFactory("resources");
  const llm = llmFactory(await config.githubToken());
  const logger = logFactory("resources-tool");
  const policy = policyFactory();

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
