/* eslint-env node */
import { ChunkIndex } from "@copilot-ld/libchunk";
import { ChunkProcessor } from "@copilot-ld/libchunk/processor.js";
import { ToolConfig } from "@copilot-ld/libconfig";
import { tokenizerFactory } from "@copilot-ld/libcopilot";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";

const _config = await ToolConfig.create("chunk");

/**
 * Main function to process all HTML files in the knowledge base directory
 * and generate a combined chunk index
 * @returns {Promise<void>}
 * @deprecated
 */
async function main() {
  const knowledgeStorage = storageFactory("knowledge");
  const chunksStorage = storageFactory("chunks");
  const chunkIndex = new ChunkIndex(chunksStorage);
  const logger = logFactory("chunk-tool");
  const tokenizer = tokenizerFactory();
  const processor = new ChunkProcessor(
    chunkIndex,
    knowledgeStorage,
    tokenizer,
    logger,
  );

  await processor.process(".html", ["[id]"]);
  await processor.persist();
}

main();
