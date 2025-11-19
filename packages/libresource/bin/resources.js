#!/usr/bin/env node
/* eslint-env node */
import { parseArgs } from "node:util";

import { createScriptConfig } from "@copilot-ld/libconfig";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";

import { ResourceProcessor } from "@copilot-ld/libresource/processor/resource.js";
import { Parser } from "@copilot-ld/libresource/parser.js";
import { Skolemizer } from "@copilot-ld/libresource/skolemizer.js";

/**
 * Process all HTML files in the knowledge base directory and generate resources
 * using the ResourceProcessor
 * @returns {Promise<void>}
 */
async function main() {
  await createScriptConfig("resources");

  const { values } = parseArgs({
    options: {
      base: {
        type: "string",
        short: "b",
        default: "https://example.invalid/",
      },
    },
  });

  const knowledgeStorage = createStorage("knowledge");
  const logger = createLogger("resources");

  const resourceIndex = createResourceIndex("resources");
  const skolemizer = new Skolemizer();
  const parser = new Parser(skolemizer, logger);

  // Process knowledge using ResourceProcessor
  const resourceProcessor = new ResourceProcessor(
    values.base,
    resourceIndex,
    knowledgeStorage,
    parser,
    logger,
  );
  await resourceProcessor.process(".html");
}

main().catch((error) => {
  console.error("Resource processing failed:", error);
  process.exit(1);
});
