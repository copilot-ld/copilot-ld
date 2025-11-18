#!/usr/bin/env node
/* eslint-env node */
import { createScriptConfig } from "@copilot-ld/libconfig";
import { PerformanceMonitor } from "@copilot-ld/libperf";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";

// Just call config to have it load environment etc.
await createScriptConfig("cosine");

/**
 * Main function to query vector index with cosine similarity
 * Reads a vector from stdin and returns similar items from the specified vector index
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();
  const logger = createLogger("cosine");
  const storage = createStorage("vectors");

  const vectorIndex = new VectorIndex(storage);
  const vector = JSON.parse(input);

  const monitor = new PerformanceMonitor();
  monitor.start(vector.length, "dimensions");

  const results = await vectorIndex.queryItems(vector);

  const metrics = monitor.stop();

  console.log(JSON.stringify(results, null, 2));
  logger.debug(`Searched content index with ${metrics.getDiagnostics()}`);
}

main();
