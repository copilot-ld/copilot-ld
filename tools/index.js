/* eslint-env node */
import { ToolConfig } from "@copilot-ld/libconfig";
import { Copilot } from "@copilot-ld/libcopilot";
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
  const vectorIndex = new VectorIndex(vectorStorage);
  const client = new Copilot(await config.githubToken());
  const logger = logFactory("index-tool");

  const processor = new VectorProcessor(
    vectorIndex,
    resourceIndex,
    client,
    logger,
  );

  // Use system actor for processing all resources
  const systemActor = "cld:system";
  await processor.process(systemActor);
  await processor.persist();
}

main();
