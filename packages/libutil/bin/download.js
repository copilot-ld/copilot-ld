#!/usr/bin/env node
/* eslint-env node */

import fs from "fs/promises";
import { ScriptConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { Logger, Finder, Download } from "@copilot-ld/libutil";

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  await ScriptConfig.create("download");

  const logger = new Logger("download");
  const finder = new Finder(fs, logger);
  const downloader = new Download(storageFactory, finder, logger);

  await downloader.initialize();
  await downloader.download();
}

main().catch((error) => {
  console.error("Download failed:", error);
  process.exit(1);
});
