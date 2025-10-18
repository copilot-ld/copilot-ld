#!/usr/bin/env node
/* eslint-env node */
import { createLogger } from "@copilot-ld/libutil";
import { createResourceIndex } from "@copilot-ld/libresource";

import { createGraphIndex } from "@copilot-ld/libgraph";
import { GraphProcessor } from "@copilot-ld/libgraph/processor.js";

/**
 * Processes resources into RDF graphs
 * @returns {Promise<void>}
 */
async function main() {
  const resourceIndex = createResourceIndex();
  const graphIndex = createGraphIndex();
  const logger = createLogger("processor");

  const processor = new GraphProcessor(graphIndex, resourceIndex, logger);

  const actor = "cld:common.System.root";

  // Process resources into RDF graphs (content only)
  await processor.process(actor);
}

main().catch((error) => {
  console.error("Graph processing failed:", error);
  process.exit(1);
});
