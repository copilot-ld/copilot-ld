#!/usr/bin/env node
/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { createLlm } from "@copilot-ld/libcopilot";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { parseArgs } from "node:util";

import { ResourceProcessor } from "@copilot-ld/libresource/processor.js";
import { DescriptorProcessor } from "@copilot-ld/libresource/descriptor.js";
import { Skolemizer } from "@copilot-ld/libresource/skolemizer.js";

/**
 * Process all HTML files in the knowledge base directory and generate resources
 * using the ResourceProcessor
 * @returns {Promise<void>}
 */
async function main() {
  const config = await ScriptConfig.create("resources");

  const { values } = parseArgs({
    options: {
      base: {
        type: "string",
      },
    },
  });

  const args = { base: values.base ?? null };
  const knowledgeStorage = createStorage("knowledge");

  const llm = createLlm(await config.githubToken(), "gpt-4o-mini");
  const logger = createLogger("resources");

  const resourceIndex = createResourceIndex();
  const descriptorProcessor = new DescriptorProcessor(llm);
  const skolemizer = new Skolemizer();

  // Process knowledge using ResourceProcessor
  const resourceProcessor = new ResourceProcessor(
    resourceIndex,
    knowledgeStorage,
    descriptorProcessor,
    skolemizer,
    logger,
    args.base,
  );
  await resourceProcessor.process(".html");
}

main().catch((error) => {
  console.error("Resource processing failed:", error);
  process.exit(1);
});
