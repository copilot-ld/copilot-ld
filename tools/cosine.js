/* eslint-env node */
import { ToolConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { VectorIndex } from "@copilot-ld/libvector";

const config = new ToolConfig("cosine");
const VECTOR_DIR = config.storagePath("vectors/policy");

/**
 * Main function to query vector index with cosine similarity
 * Reads a vector from stdin and returns similar items from the policy vector index
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();

  const storage = storageFactory(VECTOR_DIR, config);
  const index = new VectorIndex(storage);
  const vector = JSON.parse(input);
  const results = await index.queryItems(vector);

  console.log(JSON.stringify(results, null, 2));
}

main();
