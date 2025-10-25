#!/usr/bin/env node
/* eslint-env node */

/**
 * Evaluation data set processing and validation
 *
 * This script processes the evaluation data set located in `data/evalset/` into:
 * 1. Resources (stored under storage prefix `evalresources`) WITHOUT descriptors
 * 2. RDF graph quads (stored under storage prefix `evalgraphs`)
 *
 * This script mirrors the patterns used in `packages/libresource/bin/resources.js`
 * and `packages/libgraph/bin/graphs.js`, but intentionally omits the Describer
 * so evaluation resources only include structural content (JSON-LD + N-Quads)
 * and token counts. This ensures objective downstream evaluation without LLM
 * generated descriptors to reduce unnecessary processing time.
 */

import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { createGraphIndex } from "@copilot-ld/libgraph";

import { ResourceProcessor } from "@copilot-ld/libresource/processor.js";
import { Skolemizer } from "@copilot-ld/libresource/skolemizer.js";
import { GraphProcessor } from "@copilot-ld/libgraph/processor.js";

/**
 * Main entry point for evaluation dataset processing
 *
 * Steps:
 * 1. Initialize storage/index instances for eval set
 * 2. Run ResourceProcessor (no describer) over eval HTML
 * 3. Run GraphProcessor to build RDF graph + ontology
 *
 * Storage prefixes:
 * - evalset       : Raw HTML evaluation knowledge inputs (existing in data/evalset)
 * - evalresources : Processed resource messages derived from evalset
 * - evalgraphs    : Graph index built from evalresources
 */
async function main() {
  const logger = createLogger("evalset");

  // 1. Initialize storage and indices
  const knowledgeStorage = createStorage("evalset");
  const resourceIndex = createResourceIndex("evalresources");
  const graphIndex = createGraphIndex("evalgraphs");

  // Check that indices are empty before processing
  const resourceKeys = await resourceIndex.storage().list();
  const graphKeys = await graphIndex.storage().list();

  if (resourceKeys.length > 0 || graphKeys.length > 0) {
    throw new Error(
      `Indices are not empty. Delete their contents:\n` +
        `  - ${resourceIndex.storage().path()}/*\n` +
        `  - ${graphIndex.storage().path()}/*`,
    );
  }

  // 2. Resource processing. Base IRI uses placeholder stable domain.
  const base = "https://example.invalid/";
  const skolemizer = new Skolemizer();
  const resourceProcessor = new ResourceProcessor(
    base,
    resourceIndex,
    knowledgeStorage,
    skolemizer,
    null, // We don't need descriptors, so avoid calling out to the LLM
    logger,
  );

  await resourceProcessor.process(".html");

  // 3. Graph processing
  const graphProcessor = new GraphProcessor(graphIndex, resourceIndex, logger);
  const actor = "cld:common.System.root";
  await graphProcessor.process(actor);

  logger.debug("Eval dataset processing complete", {
    set: knowledgeStorage.path(),
    resources: resourceIndex.storage().path(),
    graphs: graphIndex.storage().path(),
  });
}

main().catch((error) => {
  console.error("Eval processing failed:", error);
  process.exit(1);
});
