#!/usr/bin/env node
import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { parseArgs } from "node:util";

import { ReleaseBumper } from "@copilot-ld/librel";

/**
 * Main function to handle CLI arguments and execute release bump
 * @returns {Promise<void>}
 */
async function main() {
  const { values, positionals } = parseArgs({
    options: {
      force: {
        type: "boolean",
        short: "f",
        default: false,
      },
    },
    allowPositionals: true,
  });

  const bumpType = positionals[0];
  const items = positionals.slice(1);

  if (!bumpType || items.length === 0) {
    console.error(
      "Usage: node release-bump.js [--force] <bump-type> <item1> <item2> ...",
    );
    process.exit(1);
  }

  const workingDir = process.env.INIT_CWD || process.cwd();
  const bumper = new ReleaseBumper(
    execSync,
    readFileSync,
    writeFileSync,
    readdirSync,
    workingDir,
  );

  try {
    const results = await bumper.bump(bumpType, items, { force: values.force });
    console.log(JSON.stringify(results));
  } catch (error) {
    console.error(`Error during release bump:`, error.message);
    process.exit(1);
  }
}

main();
