/* eslint-env node */
import { ChunkIndex } from "@copilot-ld/libchunk";
import { ChunkProcessor } from "@copilot-ld/libchunk/processor.js";
import { ToolConfig } from "@copilot-ld/libconfig";

const config = new ToolConfig("chunk");
const KNOWLEDGE_DIR = config.dataPath("knowledge");
const CHUNKS_DIR = config.storagePath("chunks");

/**
 * Main function to process all HTML files in the knowledge base directory
 * and generate a combined chunk index
 * @returns {Promise<void>}
 */
async function main() {
  const knowledgeStorage = config.storage(KNOWLEDGE_DIR);
  const chunksStorage = config.storage(CHUNKS_DIR);
  const chunkIndex = new ChunkIndex(chunksStorage);
  const processor = new ChunkProcessor(chunkIndex, knowledgeStorage);

  await processor.process(".html", ["[id]"]);
  await processor.persist();
}

main();
