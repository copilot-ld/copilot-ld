/* eslint-env node */
import { ChunkIndex } from "@copilot-ld/libchunk";
import { ChunkProcessor } from "@copilot-ld/libchunk/processor.js";
import { ToolConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";

const config = new ToolConfig("chunk");
const KNOWLEDGE_DIR = config.dataPath("knowledge");
const CHUNKS_DIR = config.dataPath("chunks");

/**
 * Main function to process all HTML files in the knowledge base directory
 * and generate a combined chunk index
 * @returns {Promise<void>}
 */
async function main() {
  const knowledgeStorage = storageFactory(KNOWLEDGE_DIR, config);
  const chunksStorage = storageFactory(CHUNKS_DIR, config);
  const chunkIndex = new ChunkIndex(chunksStorage);
  const processor = new ChunkProcessor(chunkIndex, knowledgeStorage);

  await processor.process(".html", ["[id]"]);
  await processor.persist();
}

main();
