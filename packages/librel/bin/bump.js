#!/usr/bin/env node
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

  // Parse flags and positional args robustly
  let force = false;
  const positional = [];
  for (const arg of args) {
    if (arg === "--force" || arg === "-f") {
      force = true;
      continue;
    }
    positional.push(arg);
  }

  const bumpType = positional.shift();
  const items = positional;

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
