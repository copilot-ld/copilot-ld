#!/usr/bin/env node
/* eslint-env node */

import { ScriptConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { Logger, Uploader } from "@copilot-ld/libutil";

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  await ScriptConfig.create("upload");

  const logger = new Logger("upload");
  const uploader = new Uploader(storageFactory, logger);

  await uploader.initialize();
  await uploader.upload();
}

main().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
