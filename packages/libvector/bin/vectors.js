#!/usr/bin/env node
/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { createLlm } from "@copilot-ld/libcopilot";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";
import { VectorProcessor } from "@copilot-ld/libvector/processor.js";

/**
 * Processes resources into vector embeddings
 * @returns {Promise<void>}
 */
async function main() {
  const config = await ScriptConfig.create("vectors");
  const vectorStorage = createStorage("vectors");

  const resourceIndex = createResourceIndex();
  const contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
  const descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");
  const llm = createLlm(await config.githubToken());
  const logger = createLogger("vectors");

  const processor = new VectorProcessor(
    contentIndex,
    descriptorIndex,
    resourceIndex,
    llm,
    logger,
  );

  const actor = "common.System.root";

  // Process both content and descriptor representations
  await processor.process(actor, "content");
  await processor.process(actor, "descriptor");
}

main().catch((error) => {
  console.error("Vector processing failed:", error);
  process.exit(1);
});
