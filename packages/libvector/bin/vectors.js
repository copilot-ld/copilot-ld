#!/usr/bin/env node
import { createScriptConfig } from "@copilot-ld/libconfig";
import { createLlmApi } from "@copilot-ld/libllm";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";
import { VectorIndex } from "@copilot-ld/libvector/index/vector.js";
import { VectorProcessor } from "@copilot-ld/libvector/processor/vector.js";

/**
 * Processes resources into vector embeddings
 * @returns {Promise<void>}
 */
async function main() {
  const config = await createScriptConfig("vectors");

  const vectorStorage = createStorage("vectors");

  const resourceIndex = createResourceIndex("resources");
  const vectorIndex = new VectorIndex(vectorStorage);
  const llm = createLlmApi(
    await config.llmToken(),
    undefined,
    config.llmBaseUrl(),
    config.embeddingBaseUrl(),
  );
  const logger = createLogger("vectors");

  const processor = new VectorProcessor(
    vectorIndex,
    resourceIndex,
    llm,
    logger,
  );

  const actor = "common.System.root";

  // Process content representation
  await processor.process(actor);
}

const logger = createLogger("vectors");

main().catch((error) => {
  logger.exception("main", error);
  process.exit(1);
});
