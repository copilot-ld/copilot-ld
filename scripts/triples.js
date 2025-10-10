/* eslint-env node */
import { Store } from "n3";
import { Policy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { TripleIndex, TripleProcessor } from "@copilot-ld/libtriple";

/**
 * Processes resources into RDF triples
 */
async function main() {
  const resourceStorage = createStorage("resources");
  const tripleStorage = createStorage("triples");
  const policyStorage = createStorage("policies");

  const policy = new Policy(policyStorage);
  const resourceIndex = new ResourceIndex(resourceStorage, policy);
  const n3Store = new Store();
  const tripleIndex = new TripleIndex(tripleStorage, n3Store, "triples.jsonl");
  const logger = createLogger("script.triples");

  const processor = new TripleProcessor(tripleIndex, resourceIndex, logger);

  const actor = "cld:common.System.root";

  // Process resources into RDF triples (content only)
  await processor.process(actor);
}

main();
