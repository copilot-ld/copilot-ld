#!/usr/bin/env node
/* eslint-env node */
import { createResourceIndex } from "@copilot-ld/libresource";
import { createLogger } from "@copilot-ld/libtelemetry";
import { createLlm } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";

import { createGraphIndex } from "@copilot-ld/libgraph";
import { GraphProcessor } from "@copilot-ld/libgraph/processor/graph.js";

/**
 * Processes resources into RDF graphs with LLM-enhanced ontology generation
 * @returns {Promise<void>}
 */
async function main() {
  const resourceIndex = createResourceIndex("resources");
  const graphIndex = createGraphIndex("graphs");
  const logger = createLogger("graphs");

  // Initialize LLM for type normalization and schema enrichment
  const config = await createScriptConfig("graphs");
  const llm = createLlm(await config.githubToken());

  // Create processor with LLM support
  const processor = new GraphProcessor(graphIndex, resourceIndex, logger, llm);

  const actor = "cld:common.System.root";

  // Process resources into RDF graphs (content only)
  await processor.process(actor);
}

main().catch((error) => {
  console.error("Graph processing failed:", error);
  process.exit(1);
});
