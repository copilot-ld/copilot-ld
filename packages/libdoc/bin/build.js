#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import mustache from "mustache";
import prettier from "prettier";

import { DocsBuilder } from "@copilot-ld/libdoc";
import { parseFrontMatter } from "../frontmatter.js";
import { createLogger } from "@copilot-ld/libtelemetry";

const logger = createLogger("doc-build");

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
    logger.error("main", "docs/ directory not found", {
      working_dir: workingDir,
    });
    process.exit(1);
  }

  const builder = new DocsBuilder(
    fs,
    path,
    marked,
    parseFrontMatter,
    mustache.render,
    prettier,
  );

  try {
    await builder.build(docsDir, distDir);
  } catch (error) {
    logger.exception("main", error);
    process.exit(1);
  }
}

main();
