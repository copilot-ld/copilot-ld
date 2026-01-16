#!/usr/bin/env node

import { createScriptConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { createDownloader, execLine } from "@copilot-ld/libutil";

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  await createScriptConfig("download");
  const downloader = await createDownloader(createStorage);
  await downloader.download();

  // If additional arguments provided, execute them after download
  execLine();
}

main().catch((error) => {
  console.error("Download failed:", error);
  process.exit(1);
});
