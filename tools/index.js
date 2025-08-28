/* eslint-env node */
import { ToolConfig } from "@copilot-ld/libconfig";
import { llmFactory } from "@copilot-ld/libcopilot";
import { Policy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";
import { VectorProcessor } from "@copilot-ld/libvector/processor.js";

// Configuration
const config = await ToolConfig.create("index");

/**
 * Main indexing function that processes resources into vector embeddings
 */
async function main() {
  const resourcesStorage = storageFactory("resources");
  const vectorStorage = storageFactory("vectors");
  const policiesStorage = storageFactory("policies");

  const policy = new Policy(policiesStorage);
  const resourceIndex = new ResourceIndex(resourcesStorage, policy);
  const contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
  const descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");
  const llm = llmFactory(await config.githubToken());
  const logger = logFactory("index-tool");

  const processor = new VectorProcessor(
    contentIndex,
    descriptorIndex,
    resourceIndex,
    llm,
    logger,
  );

  const actor = "cld:common.System.index";

  // Process both content and descriptor representations
  await processor.process(actor, "content");
  await processor.process(actor, "descriptor");
}

main();
