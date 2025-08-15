/* eslint-env node */
import { ChunkIndex } from "@copilot-ld/libchunk";
import { ToolConfig } from "@copilot-ld/libconfig";
import { Copilot } from "@copilot-ld/libcopilot";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";
import { VectorProcessor } from "@copilot-ld/libvector/processor.js";

// Configuration
const config = await ToolConfig.create("index");

/**
 * Main indexing function that processes chunks into vector embeddings
 */
async function main() {
  const chunksStorage = storageFactory("chunks");
  const vectorStorage = storageFactory("vectors");

  const chunkIndex = new ChunkIndex(chunksStorage);
  const vectorIndex = new VectorIndex(vectorStorage);
  const client = new Copilot(await config.githubToken());
  const logger = logFactory("index-tool");

  const processor = new VectorProcessor(
    vectorIndex,
    chunkIndex,
    client,
    logger,
  );

  await processor.process();
  await processor.persist();
}

main();
