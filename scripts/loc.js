#!/usr/bin/env node

/**
 * Count lines of code in the project using cloc.
 *
 * This script runs cloc on the project directory while excluding:
 * - node_modules/ directories
 * - test/ directory
 * - generated/ directories
 * @module scripts/cloc
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

try {
  // Run cloc with certain exclusions
  const result = execSync(
    "cloc . --exclude-dir=config,data,dist,examples,generated,node_modules,scripts,test,tools --quiet",
    {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "inherit"],
    },
  );

  console.log(result);
} catch (error) {
  console.error("Error running cloc:", error.message);
  process.exit(1);
}
