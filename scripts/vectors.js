/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { llmFactory } from "@copilot-ld/libcopilot";
import { Policy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";
import { VectorProcessor } from "@copilot-ld/libvector/processor.js";

// Configuration
const config = await ScriptConfig.create("vectors");

/**
 * Processes resources into vector embeddings
 */
async function main() {
  const resourceStorage = storageFactory("resources");
  const vectorStorage = storageFactory("vectors");
  const policyStorage = storageFactory("policies");

  const policy = new Policy(policyStorage);
  const resourceIndex = new ResourceIndex(resourceStorage, policy);
  const contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
  const descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");
  const llm = llmFactory(await config.githubToken());
  const logger = logFactory("script.vectors");

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

main();
