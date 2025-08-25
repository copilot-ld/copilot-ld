/* eslint-env node */
import { ToolConfig } from "@copilot-ld/libconfig";
import { policyFactory } from "@copilot-ld/libpolicy";
import { ResourceIndex, ResourceProcessor } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

const _config = await ToolConfig.create("resources");

/**
 * Main function to process all HTML files in the knowledge base directory
 * and generate resources using the ResourceProcessor
 * @returns {Promise<void>}
 */
async function main() {
  const knowledgeStorage = storageFactory("knowledge");
  const resourceStorage = storageFactory("resources");
  const logger = logFactory("resources-tool");
  const policy = policyFactory();

  const resourceIndex = new ResourceIndex(resourceStorage, policy);
  const processor = new ResourceProcessor(
    resourceIndex,
    knowledgeStorage,
    logger,
  );

  await processor.process(".html", ["[id]"]);
}

main();
