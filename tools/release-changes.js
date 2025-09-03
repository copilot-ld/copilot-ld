/* eslint-env node */
import { execSync } from "child_process";
import { existsSync } from "fs";

import { ReleaseChanges } from "@copilot-ld/librel";

/**
 * Main function to handle CLI arguments and execute release changes detection
 */
function main() {
  const args = process.argv.slice(2);
  const baseSha = args[0];
  const headSha = args[1];

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
