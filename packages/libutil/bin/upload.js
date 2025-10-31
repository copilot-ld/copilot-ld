#!/usr/bin/env node
/* eslint-env node */

import { createScriptConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { Logger, Uploader } from "@copilot-ld/libutil";
import { parseArgs } from "node:util";

/**
 * Main execution function
 * @returns {Promise<void>}
 */
async function main() {
  const { values } = parseArgs({
    options: {
      stdout: {
        type: "boolean",
        default: false,
      },
    },
  });

  const outputOnly = values.stdout;

  await createScriptConfig("upload");

  const logger = new Logger("upload");
  const uploader = new Uploader(createStorage, logger);

  await uploader.initialize(outputOnly);

  if (outputOnly) {
    // Output files to stdout for use with tar
    await uploader.output();
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
