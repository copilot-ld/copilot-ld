#!/usr/bin/env node
import { createScriptConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";

import { IngesterPipeline } from "../index.js";

/**
 * Ingest all files ingest storage
 * @returns {Promise<void>}
 */
async function main() {
  const ingestStorage = createStorage("ingest");
  const configStorage = createStorage("config");
  const config = await createScriptConfig("ingest");
  const logger = createLogger("ingestor-pipeline");

  logger.debug("main", "Starting pipeline ingest processing");

  const ingesterPipeline = new IngesterPipeline(
    ingestStorage,
    configStorage,
    config,
    logger,
  );
  await ingesterPipeline.process();
}

main().catch((error) => {
  console.error("ingestor failed:", error);
  process.exit(1);
});
