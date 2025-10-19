#!/usr/bin/env node
/* eslint-env node */
import { execSync } from "child_process";
import { existsSync } from "fs";
import { parseArgs } from "node:util";

import { ReleaseChanges } from "@copilot-ld/librel";

/**
 * Main function to handle CLI arguments and execute release changes detection
 */
function main() {
  const { positionals } = parseArgs({
    allowPositionals: true,
  });

  const baseSha = positionals[0];
  const headSha = positionals[1];

  if (!baseSha || !headSha) {
    console.error("Usage: node release-changes.js <base-sha> <head-sha>");
    process.exit(1);
  }

  try {
    const releaseChanges = new ReleaseChanges(execSync, existsSync);
    const items = releaseChanges.getChangedPackages(baseSha, headSha);

    // Output as JSON for GitHub Actions
    console.log(JSON.stringify(items));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
