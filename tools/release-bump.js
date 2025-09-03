/* eslint-env node */
import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync } from "fs";

import { ReleaseBumper } from "@copilot-ld/librel";

/**
 * Main function to handle CLI arguments and execute release bump
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0];

  // Parse optional flags
  const forceIndex = args.findIndex((a) => a === "--force" || a === "-f");
  const force = forceIndex !== -1;
  const filtered =
    forceIndex === -1
      ? args.slice(1)
      : args.slice(1).filter((_, i) => i !== forceIndex - 1);
  const items = filtered;

  if (!bumpType || items.length === 0) {
    console.error(
      "Usage: node release-bump.js [--force] <bump-type> <item1> <item2> ...",
    );
    process.exit(1);
  }

  const bumper = new ReleaseBumper(
    execSync,
    readFileSync,
    writeFileSync,
    readdirSync,
  );

  try {
    const results = await bumper.bump(bumpType, items, { force });
    console.log(JSON.stringify(results));
  } catch (error) {
    console.error(`Error during release bump:`, error.message);
    process.exit(1);
  }
}

main();
