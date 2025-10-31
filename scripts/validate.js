#!/usr/bin/env node
/* eslint-env node */
/**
 * HTML validation script using Prettier's parser.
 *
 * Usage: find examples/knowledge -name "*.html" | node scripts/validate.js
 */
import fs from "node:fs";
import readline from "node:readline";
import prettier from "prettier";

/**
 * Main validation function.
 * Reads file paths from stdin and validates each HTML file.
 */
async function main() {
  const rl = readline.createInterface({ input: process.stdin });
  let errorCount = 0;

  for await (const file of rl) {
    const path = file.trim();
    if (!path) continue;

    try {
      const html = fs.readFileSync(path, "utf8");
      await prettier.format(html, { parser: "html" });
      console.log(`${path}: OK`);
    } catch (err) {
      const { line = "?", column = "?" } = err.loc?.start ?? {};
      console.log(`${path}:${line}:${column} ${err.message}`);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    console.error(`\nValidation failed with ${errorCount} error(s).`);
    process.exit(2);
  }
  console.log("\nAll files passed HTML validation.");
}

main();
