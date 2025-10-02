#!/usr/bin/env node
/* eslint-env node */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import protoLoader from "@grpc/proto-loader";
import mustache from "mustache";

import {
  Codegen,
  resolveProjectRoot,
  resolvePackagePath,
} from "@copilot-ld/libutil";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve the generated directory path for a package
 * @param {string} projectRoot - Project root directory path
 * @param {"libtype"|"librpc"} packageName - Package name without scope
 * @returns {string} Absolute path to package's generated directory
 */
function resolveGeneratedPath(projectRoot, packageName) {
  const packagePath = resolvePackagePath(projectRoot, packageName);
  return path.join(packagePath, "generated");
}

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
 * Parse target path from --target=<path> argument
 * @param {string[]} args - Command line arguments
 * @returns {string|null} Target path or null if not specified
 */
function parseSourcePath(args) {
  const sourceArg = args.find((arg) => arg.startsWith("--source="));
  if (!sourceArg) return null;

  const sourcePath = sourceArg.substring("--source=".length);
  if (!sourcePath) {
    throw new Error("--source requires a path");
  }

  // Resolve relative paths based on original working directory.
  // INIT_CWD contains the original working directory before npm/npx changed it.
  const cwd = process.env.INIT_CWD || process.cwd();
  return path.resolve(cwd, sourcePath);
}

/**
 * Create symlink from source to target directory
 * @param {string} sourcePath - Source directory path
 * @param {string} targetPath - Target directory path
 */
async function createSymlink(sourcePath, targetPath) {
  // Ensure the source directory exists
  fs.mkdirSync(sourcePath, { recursive: true });

  // Remove the existing target if it exists
  if (fs.existsSync(targetPath)) {
    const stats = fs.lstatSync(targetPath);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(targetPath);
    } else {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  }

  // Create the symlink
  fs.symlinkSync(sourcePath, targetPath, "dir");
}

/**
 * Create symlinks for generated packages
 * @param {string} projectRoot - Project root directory path
 * @param {string} sourcePath - Source path for symlinks
 * @param {string[]} packageNames - Array of package names to create symlinks for
 */
async function createPackageSymlinks(projectRoot, sourcePath, packageNames) {
  const tasks = packageNames.map((packageName) =>
    createSymlink(sourcePath, resolveGeneratedPath(projectRoot, packageName)),
  );

  await Promise.all(tasks);
}

/**
 * Print CLI usage help
 */
function printUsage() {
  process.stdout.write(
    [
      "Usage:",
      `  npx codegen --source=/path/to/generated        # Create symlinks only`,
      `  npx codegen --all --source=/path/to/generated  # Generate all code **and** create symlinks`,
      `  npx codegen --all                              # Generate all code only`,
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
 */
async function runCodegen(codegen, projectRoot, flags) {
  const flagSet = new Set(flags);
  const doAll = flagSet.has("--all");
  const doTypes = doAll || flagSet.has("--type");
  const doServices = doAll || flagSet.has("--service");
  const doClients = doAll || flagSet.has("--client");
  const doDefinitions = doAll || flagSet.has("--definition");
  const sourcePath = parseSourcePath(flags);
  const doExports = doServices || doClients || doDefinitions || doAll;
  const doGenerate = doTypes || doServices || doClients || doDefinitions;

  // Handle --source only case (no generation flags)
  if (!doGenerate) {
    if (sourcePath) {
      await createPackageSymlinks(projectRoot, sourcePath, [
        "libtype",
        "librpc",
      ]);
      return;
    }
    printUsage();
    process.exitCode = 1;
    return;
  }

  // Determine output paths
  const libtypeGeneratedPath = doTypes
    ? sourcePath || resolveGeneratedPath(projectRoot, "libtype")
    : null;
  const librpcGeneratedPath = doExports
    ? sourcePath || resolveGeneratedPath(projectRoot, "librpc")
    : null;

  // Run generation tasks
  await Promise.all(
    [
      doTypes && codegen.runTypes(libtypeGeneratedPath),
      doServices && codegen.runForKind("service", librpcGeneratedPath),
      doClients && codegen.runForKind("client", librpcGeneratedPath),
      doDefinitions && codegen.runDefinitions(librpcGeneratedPath),
    ].filter(Boolean),
  );

  // Generate librpc exports after services and clients
  if (doExports) {
    await codegen.runServicesExports(librpcGeneratedPath);
  }

  // Create symlinks if using source path
  if (sourcePath) {
    const packageNames = [];
    if (doTypes) packageNames.push("libtype");
    if (doExports) packageNames.push("librpc");
    await createPackageSymlinks(projectRoot, sourcePath, packageNames);

    // Create bundle of all directories in source path
    if (doGenerate) {
      await createBundle(sourcePath);
    }
  }
}

/**
 * CLI entry point
 */
async function main() {
  try {
    const projectRoot = resolveProjectRoot(__dirname);
    const codegen = new Codegen(projectRoot, path, mustache, protoLoader, fs);

    const flags = process.argv.slice(2);
    await runCodegen(codegen, projectRoot, flags);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`Unexpected error: ${err.message}\n`);
  process.exit(1);
});
