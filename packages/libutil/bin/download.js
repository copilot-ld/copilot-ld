#!/usr/bin/env node
/* eslint-env node */

import { ScriptConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { createDownloader, execLine } from "@copilot-ld/libutil";

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  await ScriptConfig.create("download");
  const downloader = createDownloader(createStorage);
  await downloader.download();

  // If additional arguments provided, execute them after download
  execLine();
}

main().catch((error) => {
  console.error("Download failed:", error);
  process.exit(1);
});
