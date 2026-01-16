#!/usr/bin/env node
import { createResourceIndex } from "@copilot-ld/libresource";
import { createLogger } from "@copilot-ld/libtelemetry";

import { createGraphIndex } from "@copilot-ld/libgraph";
import { GraphProcessor } from "@copilot-ld/libgraph/processor/graph.js";

/**
 * Processes resources into RDF graphs
 * @returns {Promise<void>}
 */
async function main() {
  const resourceIndex = createResourceIndex("resources");
  const graphIndex = createGraphIndex("graphs");
  const logger = createLogger("graphs");

  const processor = new GraphProcessor(graphIndex, resourceIndex, logger);

  const actor = "cld:common.System.root";

  // Process resources into RDF graphs (content only)
  await processor.process(actor);
}

const logger = createLogger("graphs");

main().catch((error) => {
  logger.exception("main", error);
  process.exit(1);
});
