/* eslint-env node */
import { createLogger } from "@copilot-ld/libutil";
import { GraphProcessor, createGraphIndex } from "@copilot-ld/libgraph";
import { createResourceIndex } from "@copilot-ld/libresource";

/**
 * Processes resources into RDF graphs
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

main();
