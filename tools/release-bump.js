/* eslint-env node */
import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { ReleaseBumper } from "../packages/librel/index.js";

/**
 * Main function to handle CLI arguments and execute release bump
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);
  const bumpType = args[0];
  const items = args.slice(1);

  if (!bumpType || items.length === 0) {
    console.error("Usage: release-bump <bump-type> <item1> <item2> ...");
    process.exit(1);
  }

  const bumper = new ReleaseBumper(
    execSync,
    readFileSync,
    writeFileSync,
    readdirSync,
  );

  try {
    const results = await bumper.bump(bumpType, items);
    console.log(JSON.stringify(results));
  } catch (error) {
    console.error(`Error during release bump:`, error.message);
    process.exit(1);
  }
}

main();
