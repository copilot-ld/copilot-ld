#!/usr/bin/env node
/* eslint-env node */
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";

import { IngesterLoad } from "../index.js";

/**
 * Ingest all files ingest storage
 * @returns {Promise<void>}
 */
async function main() {
  const configStorage = createStorage("config");
  const ingestStorage = createStorage("ingest");
  const logger = createLogger("ingestor-load");

  logger.debug("Starting ingestor");

  const ingesterLoad = new IngesterLoad(ingestStorage, configStorage, logger);
  await ingesterLoad.process();
}

main().catch((error) => {
  console.error("ingestor failed:", error);
  process.exit(1);
});
