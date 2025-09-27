#!/usr/bin/env node
/* eslint-env node */

import { ScriptConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { Logger, Download } from "@copilot-ld/libutil";

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  await ScriptConfig.create("download-script");
  
  const logger = new Logger("download-script");
  const downloader = new Download(storageFactory, logger);
  
  await downloader.initialize();
  await downloader.download();
}

main().catch((error) => {
  console.error("Download failed:", error);
  process.exit(1);
});