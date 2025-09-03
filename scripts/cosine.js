/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
import { PerformanceMonitor } from "@copilot-ld/libperf";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";

// Just call config to have it load environment etc.
await ScriptConfig.create("cosine");

/**
 * Main function to query vector index with cosine similarity
 * Reads a vector from stdin and returns similar items from the specified vector index
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();
  const logger = logFactory("cosine");
  const storage = storageFactory("vectors");

  // Get index from command line arguments (default to content)
  const index = process.argv[2] || "content";
  const indexKey = index === "descriptor" ? "descriptors.json" : "content.json";

  const vectorIndex = new VectorIndex(storage, indexKey);
  const vector = JSON.parse(input);

  const monitor = new PerformanceMonitor();
  monitor.start(vector.length, "dimensions");

  const results = await vectorIndex.queryItems(vector);

  const metrics = monitor.stop();

  console.log(JSON.stringify(results, null, 2));
  logger.debug(`Searched ${index} index with ${metrics.getDiagnostics()}`);
}

main();
