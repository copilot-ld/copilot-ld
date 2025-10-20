#!/usr/bin/env node
/* eslint-env node */
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import matter from "gray-matter";
import mustache from "mustache";
import prettier from "prettier";

import { DocsBuilder } from "@copilot-ld/libdoc";

/**
 * Main function to handle CLI execution
 * @returns {Promise<void>}
 */
async function main() {
  const workingDir = process.env.INIT_CWD || process.cwd();
  const docsDir = path.join(workingDir, "docs");
  const distDir = path.join(workingDir, "dist");

  // Validate docs directory exists
  if (!fs.existsSync(docsDir)) {
    console.error(`Error: docs/ directory not found in ${workingDir}`);
    process.exit(1);
  }

  const builder = new DocsBuilder(
    fs,
    path,
    marked,
    matter,
    mustache.render,
    prettier,
  );

  try {
    await builder.build(docsDir, distDir);
  } catch (error) {
    console.error(`Error during build:`, error.message);
    process.exit(1);
  }
}

main();
