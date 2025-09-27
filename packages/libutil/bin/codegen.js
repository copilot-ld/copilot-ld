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
 * Create tar.gz bundle of all directories inside targetPath
 * @param {string} targetPath - Path containing directories to bundle
 */
async function createBundle(targetPath) {
  const bundlePath = path.join(targetPath, "bundle.tar.gz");

  // Get all directories in targetPath
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (directories.length === 0) {
    return; // No directories to bundle
  }

  // Create tar.gz archive using system tar command
  try {
    const directoriesArg = directories.join(" ");
    execSync(`tar -czf "${bundlePath}" -C "${targetPath}" ${directoriesArg}`, {
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
function parseTargetPath(args) {
  const targetArg = args.find((arg) => arg.startsWith("--target="));
  if (!targetArg) return null;

  const targetPath = targetArg.substring("--target=".length);
  if (!targetPath) {
    throw new Error("--target requires a path: --target=/path/to/generated");
  }

  // Resolve relative paths based on where the command was originally executed from
  // process.env.INIT_CWD contains the original working directory before npm/npx changed it
  const originalCwd = process.env.INIT_CWD || process.cwd();
  return path.resolve(originalCwd, targetPath);
}

/**
 * Create symlink from source to target directory
 * @param {string} sourcePath - Source directory path
 * @param {string} targetPath - Target directory path
 */
async function createSymlink(sourcePath, targetPath) {
  if (fs.existsSync(targetPath)) {
    const stats = fs.lstatSync(targetPath);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(targetPath);
    } else if (stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      throw new Error(
        `Target path exists and is not a directory or symlink: ${targetPath}`,
      );
    }
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.symlinkSync(sourcePath, targetPath, "dir");
}

/**
 * Create symlinks for generated packages
 * @param {string} projectRoot - Project root directory path
 * @param {string} targetPath - Target path for symlinks
 * @param {string[]} packageNames - Array of package names to create symlinks for
 */
async function createPackageSymlinks(projectRoot, targetPath, packageNames) {
  const tasks = packageNames.map((packageName) =>
    createSymlink(targetPath, resolveGeneratedPath(projectRoot, packageName)),
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
      `  npx codegen --type`,
      `  npx codegen --service  # Generate service bases`,
      `  npx codegen --client   # Generate clients`,
      `  npx codegen --all      # Generate all`,
      `  npx codegen --target=/path/to/generated  # Create symlinks only`,
      `  npx codegen --all --target=/path/to/generated  # Generate and symlink`,
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
  const targetPath = parseTargetPath(flags);
  const doLibrpc = doServices || doClients || doAll;
  const hasGenerationFlags = doTypes || doServices || doClients;

  // Handle --target only case (no generation flags)
  if (!hasGenerationFlags) {
    if (targetPath) {
      await createPackageSymlinks(projectRoot, targetPath, [
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
    ? targetPath || resolveGeneratedPath(projectRoot, "libtype")
    : null;
  const librpcGeneratedPath = doLibrpc
    ? targetPath || resolveGeneratedPath(projectRoot, "librpc")
    : null;

  // Run generation tasks
  await Promise.all(
    [
      doTypes && codegen.runTypes(libtypeGeneratedPath),
      doServices && codegen.runForKind("service", librpcGeneratedPath),
      doClients && codegen.runForKind("client", librpcGeneratedPath),
    ].filter(Boolean),
  );

  // Generate librpc exports after services and clients
  if (doLibrpc) {
    await codegen.runServicesExports(librpcGeneratedPath);
  }

  // Create symlinks if using target path
  if (targetPath) {
    const packageNames = [];
    if (doTypes) packageNames.push("libtype");
    if (doLibrpc) packageNames.push("librpc");
    await createPackageSymlinks(projectRoot, targetPath, packageNames);

    // Create bundle.tar.gz of all directories in targetPath
    if (hasGenerationFlags) {
      await createBundle(targetPath);
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
