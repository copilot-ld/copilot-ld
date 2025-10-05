#!/usr/bin/env node
/* eslint-env node */

import { ScriptConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { downloadFactory, execLine } from "@copilot-ld/libutil";

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  await ScriptConfig.create("download");
  const downloader = downloadFactory(storageFactory);
  await downloader.download();

  // If additional arguments provided, execute them after download
  execLine();
}

main().catch((error) => {
  console.error("Download failed:", error);
  process.exit(1);
});
