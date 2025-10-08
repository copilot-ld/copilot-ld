/* eslint-env node */
import { Store } from "n3";
import { Policy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { TripleIndex, TripleProcessor } from "@copilot-ld/libtriple";

/**
 * Processes resources into RDF triples
 */
async function main() {
  const resourceStorage = storageFactory("resources");
  const tripleStorage = storageFactory("triples");
  const policyStorage = storageFactory("policies");

  const policy = new Policy(policyStorage);
  const resourceIndex = new ResourceIndex(resourceStorage, policy);
  const n3Store = new Store();
  const tripleIndex = new TripleIndex(tripleStorage, n3Store, "triples.jsonl");
  const logger = logFactory("script.triples");

  const processor = new TripleProcessor(tripleIndex, resourceIndex, logger);

  const actor = "cld:common.System.root";

  // Process resources into RDF triples (content only)
  await processor.process(actor);
}

main();
