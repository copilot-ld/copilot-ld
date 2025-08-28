/* eslint-env node */
import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run a command with arguments and options
 * @param {string} cmd - Command to run
 * @param {string[]} args - Arguments for the command
 * @param {object} opts - Options for the command
 * @returns {Promise<void>}
 */
function run(cmd, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = execFile(cmd, args, { stdio: "inherit", ...opts }, (err) => {
      if (err) reject(err);
      else resolvePromise();
    });
    child.on("error", reject);
  });
}

/**
 * Generate JavaScript types using pbjs
 * @param {string} root - Project root directory
 * @param {string[]} protoFiles - Array of proto file paths
 * @param {string} outFile - Output file path
 */
async function generateJavaScriptTypes(root, protoFiles, outFile) {
  const args = [
    "-t",
    "static-module",
    "-w",
    "es6",
    "--no-delimited",
    "--no-create",
    "--no-service",
    "--force-message",
    "--keep-case",
    "-o",
    outFile,
    ...protoFiles,
  ];

  await run(process.execPath, [
    resolve(root, "node_modules/protobufjs-cli/bin/pbjs"),
    ...args,
  ]);
}

/**
 * Generate TypeScript declarations using pbts
 * @param {string} root - Project root directory
 * @param {string} jsFile - Input JavaScript file path
 * @param {string} outFile - Output .d.ts file path
 */
async function generateTypeScriptDeclarations(root, jsFile, outFile) {
  const args = ["-o", outFile, jsFile];

  await run(process.execPath, [
    resolve(root, "node_modules/protobufjs-cli/bin/pbts"),
    ...args,
  ]);
}

/**
 * Generate TypeScript types from protobuf definitions
 */
async function main() {
  const root = resolve(__dirname, "..");
  const protoDir = resolve(root, "proto");
  const jsOutFile = resolve(root, "packages/libtype/types.js");
  const dtsOutFile = resolve(root, "packages/libtype/types.d.ts");

  // Ensure output directory exists
  await mkdir(resolve(root, "packages/libtype"), { recursive: true });

  // Define proto files to process
  const protoFiles = [
    "resource.proto",
    "common.proto",
    "agent.proto",
    "history.proto",
    "llm.proto",
    "text.proto",
    "vector.proto",
  ].map((p) => resolve(protoDir, p));

  // Clean existing files to avoid stale content
  await rm(jsOutFile, { force: true });
  await rm(dtsOutFile, { force: true });

  // Generate JavaScript types using pbjs
  await generateJavaScriptTypes(root, protoFiles, jsOutFile);

  // ESM resolution fix: ensure explicit extension for Node ESM
  const content = await (
    await import("node:fs/promises")
  ).readFile(jsOutFile, "utf8");
  // 1) Add .js extension for Node ESM
  // 2) Convert namespace import to default import to access CJS exports directly
  let fixed = content.replace(
    /from\s+"protobufjs\/minimal";/,
    'from "protobufjs/minimal.js";',
  );
  fixed = fixed.replace(
    /import\s+\*\s+as\s+\$protobuf\s+from\s+"protobufjs\/minimal\.js";/,
    'import $protobuf from "protobufjs/minimal.js";',
  );
  if (fixed !== content) await writeFile(jsOutFile, fixed, "utf8");

  // Generate TypeScript declarations using pbts
  await generateTypeScriptDeclarations(root, jsOutFile, dtsOutFile);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
