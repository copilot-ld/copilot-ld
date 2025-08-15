/* eslint-env node */
import { ToolConfig } from "@copilot-ld/libconfig";
import { PerformanceMonitor } from "@copilot-ld/libperf";
import { storageFactory } from "@copilot-ld/libstorage";
import { logFactory } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";

// Just call config to have it load environment etc.
await ToolConfig.create("cosine");

/**
 * Main function to query vector index with cosine similarity
 * Reads a vector from stdin and returns similar items from the policy vector index
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();
  const logger = logFactory("cosine");
  const storage = storageFactory("vectors");
  const index = new VectorIndex(storage);
  const vector = JSON.parse(input);

  const monitor = new PerformanceMonitor();
  monitor.start(vector.length, "dimensions");

  const results = await index.queryItems(vector);

  const metrics = monitor.stop();

  console.log(JSON.stringify(results, null, 2));
  logger.debug(metrics.getDiagnostics());
}

main();
