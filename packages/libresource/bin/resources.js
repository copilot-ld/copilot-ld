#!/usr/bin/env node
/* eslint-env node */
import { createScriptConfig } from "@copilot-ld/libconfig";
import { createLlm } from "@copilot-ld/libcopilot";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { parseArgs } from "node:util";

import { ResourceProcessor } from "@copilot-ld/libresource/processor.js";
import { Parser } from "@copilot-ld/libresource/parser.js";
import { Describer } from "@copilot-ld/libresource/describer.js";
import { Skolemizer } from "@copilot-ld/libresource/skolemizer.js";

/**
 * Process all HTML files in the knowledge base directory and generate resources
 * using the ResourceProcessor
 * @returns {Promise<void>}
 */
async function main() {
  const config = await createScriptConfig("resources");

  const { values } = parseArgs({
    options: {
      base: {
        type: "string",
        short: "b",
        default: "https://example.invalid/",
      },
      fast: {
        type: "boolean",
        short: "f",
        default: false,
      },
    },
  });

  const knowledgeStorage = createStorage("knowledge");

  const llm = createLlm(await config.githubToken(), "gpt-4o-mini");
  const logger = createLogger("resources");

  const resourceIndex = createResourceIndex("resources");
  const describer = values.fast ? null : new Describer(llm);
  const skolemizer = new Skolemizer();
  const parser = new Parser(skolemizer, logger);

  // Process knowledge using ResourceProcessor
  const resourceProcessor = new ResourceProcessor(
    values.base,
    resourceIndex,
    knowledgeStorage,
    parser,
    describer,
    logger,
  );
  await resourceProcessor.process(".html");
}

main().catch((error) => {
  console.error("Resource processing failed:", error);
  process.exit(1);
});
