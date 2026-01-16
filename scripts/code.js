#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { formatForAnalysis } from "@copilot-ld/libanalysis";

/**
 * Main function to format markdown with line numbers
 * Reads markdown file, formats it with Prettier, and outputs with line numbers
 * @returns {Promise<void>}
 */
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Error: No file path provided");
    console.error("Usage: node code.js <path-to-markdown-file>");
    process.exit(1);
  }

  try {
    const markdown = await readFile(filePath, "utf-8");
    const formatted = await formatForAnalysis(markdown);
    console.log(formatted);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
