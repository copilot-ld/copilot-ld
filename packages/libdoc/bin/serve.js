#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { marked } from "marked";
import mustache from "mustache";
import prettier from "prettier";

import { DocsBuilder, DocsServer } from "@copilot-ld/libdoc";
import { parseFrontMatter } from "../frontmatter.js";
import { createLogger } from "@copilot-ld/libtelemetry";

const logger = createLogger("doc-serve");

/**
 * Main function to handle CLI execution
 * @returns {Promise<void>}
 */
async function main() {
  const { values } = parseArgs({
    options: {
      port: {
        type: "string",
        short: "p",
        default: "3000",
      },
      watch: {
        type: "boolean",
        short: "w",
        default: false,
      },
    },
    allowPositionals: false,
  });

  const workingDir = process.env.INIT_CWD || process.cwd();
  const docsDir = path.join(workingDir, "docs");
  const distDir = path.join(workingDir, "dist");
  const port = parseInt(values.port, 10);

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
  const server = new DocsServer(fs, Hono, serve, builder);

  try {
    // Initial build
    await builder.build(docsDir, distDir);

    // Start watch if requested
    if (values.watch) {
      server.watch(docsDir, distDir);
    }

    // Start server
    server.serve(distDir, { port, hostname: "0.0.0.0" });

    logger.info("main", "Press Ctrl+C to stop");
  } catch (error) {
    logger.exception("main", error);
    process.exit(1);
  }
}

main();
