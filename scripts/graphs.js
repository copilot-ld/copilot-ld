/* eslint-env node */
import { Store } from "n3";
import { Policy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { GraphIndex, GraphProcessor } from "@copilot-ld/libgraph";

/**
 * Processes resources into RDF graphs
 */
async function main() {
  const resourceStorage = createStorage("resources");
  const graphStorage = createStorage("graphs");
  const policyStorage = createStorage("policies");

  const policy = new Policy(policyStorage);
  const resourceIndex = new ResourceIndex(resourceStorage, policy);
  const n3Store = new Store();
  const graphIndex = new GraphIndex(graphStorage, n3Store, "graphs.jsonl");
  const logger = createLogger("script.graphs");

  const processor = new GraphProcessor(graphIndex, resourceIndex, logger);

  const actor = "cld:common.System.root";

  // Process resources into RDF graphs (content only)
  await processor.process(actor);
}

main();
