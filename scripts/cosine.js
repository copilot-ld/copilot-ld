#!/usr/bin/env node
/* eslint-env node */
import { createScriptConfig } from "@copilot-ld/libconfig";
import { PerformanceMonitor } from "@copilot-ld/libperf";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";
import { parseArgs } from "node:util";

// Just call config to have it load environment etc.
await createScriptConfig("cosine");

/**
 * Main function to query vector index with cosine similarity
 * Reads a vector from stdin and returns similar items from the specified vector index
 * @returns {Promise<void>}
 */
async function main() {
  const { values } = parseArgs({
    options: {
      index: {
        type: "string",
        short: "i",
        default: "content",
      },
    },
  });

  const input = (await process.stdin.toArray()).join("").trim();
  const logger = createLogger("cosine");
  const storage = createStorage("vectors");

  const index = values.index;
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
