#!/usr/bin/env node
/* eslint-env node */

import { ScriptConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { Logger, Uploader } from "@copilot-ld/libutil";

/**
 * Parse command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const outputOnly = args.includes("--stdout");

  return { outputOnly };
}

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  const { outputOnly } = parseArgs();

  await ScriptConfig.create("upload");

  const logger = new Logger("upload");
  const uploader = new Uploader(storageFactory, logger);

  await uploader.initialize(outputOnly);

  if (outputOnly) {
    // List files to stdout for use with tar
    await uploader.listFiles();
  } else {
    console.log("Uploading data to remote storage");
    await uploader.upload();
    console.log("Upload completed successfully");
  }
}

main().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
