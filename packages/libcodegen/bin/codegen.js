#!/usr/bin/env node
/* eslint-env node */

import fs from "node:fs";
import fsAsync from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import protoLoader from "@grpc/proto-loader";
import mustache from "mustache";

import { Finder, Logger } from "@copilot-ld/libutil";
import { Codegen } from "@copilot-ld/libcodegen";
import { storageFactory } from "@copilot-ld/libstorage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create tar.gz bundle of all directories inside sourcePath
 * @param {string} sourcePath - Path containing directories to bundle
 */
async function createBundle(sourcePath) {
  const bundlePath = path.join(sourcePath, "bundle.tar.gz");

  // Get all directories in sourcePath
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (directories.length === 0) {
    return; // No directories to bundle
  }

  // Create tar.gz archive using system tar command
  try {
    const directoriesArg = directories.join(" ");
    execSync(`tar -czf "${bundlePath}" -C "${sourcePath}" ${directoriesArg}`, {
      stdio: "pipe",
    });
  } catch (error) {
    throw new Error(`Failed to create bundle: ${error.message}`);
  }
}

/**
 * Print CLI usage help
 */
function printUsage() {
  process.stdout.write(
    [
      "Usage:",
      `  npx codegen --all                              # Generate all code`,
      `  npx codegen --type                             # Generate protobuf types only`,
      `  npx codegen --service                          # Generate service bases only`,
      `  npx codegen --client                           # Generate clients only`,
      `  npx codegen --definition                       # Generate service definitions only`,
    ].join("\n") + "\n",
  );
}

/**
 * Main CLI execution function
 * @param {Codegen} codegen - Configured codegen instance
 * @param {string} projectRoot - Project root directory path
 * @param {string[]} flags - Command line flags
 * @param {Finder} finder - Finder instance for path management
 */
async function runCodegen(codegen, projectRoot, flags, finder) {
  const flagSet = new Set(flags);
  const doAll = flagSet.has("--all");
  const doTypes = doAll || flagSet.has("--type");
  const doServices = doAll || flagSet.has("--service");
  const doClients = doAll || flagSet.has("--client");
  const doDefinitions = doAll || flagSet.has("--definition");
  const doExports = doServices || doClients || doDefinitions || doAll;
  const doGenerate = doTypes || doServices || doClients || doDefinitions;

  // Show usage if no generation flags provided
  if (!doGenerate) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  // Step 1: Resolve generated SOURCE path using shared pattern
  const generatedStorage = storageFactory("generated", "local");
  const sourcePath = generatedStorage.path();

  // Step 2: Ensure storage bucket exists BEFORE generation
  await generatedStorage.ensureBucket();

  // Step 3: Generate code to SOURCE path
  await Promise.all(
    [
      doTypes && codegen.runTypes(sourcePath),
      doServices && codegen.runForKind("service", sourcePath),
      doClients && codegen.runForKind("client", sourcePath),
      doDefinitions && codegen.runDefinitions(sourcePath),
    ].filter(Boolean),
  );

  // Generate librpc exports after services and clients
  if (doExports) {
    await codegen.runServicesExports(sourcePath);
  }

  // Step 4: Create symlinks from TARGET packages to SOURCE
  await finder.createPackageSymlinks(sourcePath);

  // Step 5: Create bundle of all generated directories
  await createBundle(sourcePath);
}

/**
 * Find the monorepo root directory (the one with workspaces)
 * @param {string} startPath - Starting directory path
 * @returns {string} Project root directory path
 */
function findMonorepoRoot(startPath) {
  let current = startPath;
  for (let depth = 0; depth < 10; depth++) {
    const packageJsonPath = path.join(current, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      // Check if this package.json has workspaces (indicates monorepo root)
      if (packageJson.workspaces) {
        return current;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Could not find monorepo root");
}

/**
 * CLI entry point
 */
async function main() {
  try {
    const logger = new Logger("codegen");
    const finder = new Finder(fsAsync, logger, process);
    const projectRoot = findMonorepoRoot(__dirname);
    const codegen = new Codegen(projectRoot, path, mustache, protoLoader, fs);

    const flags = process.argv.slice(2);
    await runCodegen(codegen, projectRoot, flags, finder);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`Unexpected error: ${err.message}\n`);
  process.exit(1);
});
