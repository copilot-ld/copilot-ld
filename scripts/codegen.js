#!/usr/bin/env node
/* eslint-env node */

import { execFile } from "node:child_process";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import fs from "node:fs";
import protoLoader from "@grpc/proto-loader";
import mustache from "mustache";
import path, { dirname, resolve } from "node:path";
import prettier from "prettier";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Deterministic ordering by:
// 1. Reading all .proto files in proto/ directory
// 2. Sorting alphabetically
// 3. Ensuring 'common.proto' (shared types) is processed first when present

/**
 * Collect protobuf file paths for generation.
 * - Discovers all root proto files (proto/*.proto) with deterministic ordering
 * - Ensures common.proto loads first when present
 * - Optionally appends any tool proto files (tools/*.proto)
 * @param {string} projectRoot - Repository root
 * @param {object} [opts] - Optional collection settings
 * @param {boolean} [opts.includeTools] - Whether to include tool proto files
 * @returns {string[]} Absolute paths to proto files
 */
function collectProtoFiles(projectRoot, opts = {}) {
  const { includeTools = true } = opts;
  const protoDir = path.join(projectRoot, "proto");
  const toolsDir = path.join(projectRoot, "tools");

  const discovered = fs
    .readdirSync(protoDir)
    .filter((f) => f.endsWith(".proto"))
    .sort();
  const ordered = [];
  if (discovered.includes("common.proto"))
    ordered.push(path.join(protoDir, "common.proto"));
  for (const f of discovered)
    if (f !== "common.proto") ordered.push(path.join(protoDir, f));

  if (includeTools) {
    try {
      const toolProtos = fs
        .readdirSync(toolsDir)
        .filter((f) => f.endsWith(".proto"))
        .map((f) => path.join(toolsDir, f));
      ordered.push(...toolProtos);
    } catch {
      // tools directory may not exist; ignore
    }
  }

  return ordered;
}

/**
 * Load mustache template for given kind (service|client)
 * @param {"service"|"client"} kind - Template kind
 * @returns {string} Template content
 */
function loadTemplate(kind) {
  const templatePath = path.join(__dirname, `${kind}.js.mustache`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing ${kind}.js.mustache template`);
  }
  return fs.readFileSync(templatePath, "utf8");
}

/**
 * Small contract
 * - Inputs: CLI flags --type | --service | --client | --all
 * - Outputs: Generated files in generated/ (types, proto copies, service/client artifacts)
 * - Error modes: throws on subprocess failures or malformed proto
 * - Success: exits 0 after requested generators complete
 */

/**
 * Run a command with arguments and options
 * @param {string} cmd - Command to execute
 * @param {string[]} args - Command-line arguments
 * @param {object} [opts] - Child process options
 * @returns {Promise<void>} Resolves when the command completes successfully
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

// --- Types generation (protobufjs pbjs/pbts) ---
/**
 * Generate JavaScript types using protobufjs pbjs
 * @param {string} root - Project root directory
 * @param {string[]} protoFiles - Array of absolute .proto file paths
 * @param {string} outFile - Absolute output path for generated JS module
 * @returns {Promise<void>}
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
 * Generate TypeScript declarations from JS using pbts
 * @param {string} root - Project root directory
 * @param {string} jsFile - Absolute path to input JS file
 * @param {string} outFile - Absolute path to output .d.ts file
 * @returns {Promise<void>}
 */
async function generateTypeScriptDeclarationsPbts(root, jsFile, outFile) {
  const args = ["-o", outFile, jsFile];
  await run(process.execPath, [
    resolve(root, "node_modules/protobufjs-cli/bin/pbts"),
    ...args,
  ]);
}

/**
 * Generate libtype/types.js and types.d.ts from project protobufs
 * @returns {Promise<void>}
 */
async function runTypes() {
  const root = resolve(__dirname, "..");
  const generatedRoot = resolve(root, "generated");
  const typesDir = resolve(generatedRoot, "types");
  const protoOutDir = resolve(generatedRoot, "proto");
  const jsOutFile = resolve(typesDir, "types.js");
  const dtsOutFile = resolve(typesDir, "types.d.ts");

  await mkdir(typesDir, { recursive: true });
  await mkdir(protoOutDir, { recursive: true });

  const protoFiles = collectProtoFiles(root, { includeTools: true });

  // Copy all proto source files into generated/proto for runtime loading
  for (const abs of protoFiles) {
    const base = path.basename(abs);
    await fs.promises.copyFile(abs, resolve(protoOutDir, base));
  }

  await rm(jsOutFile, { force: true });
  await rm(dtsOutFile, { force: true });

  await generateJavaScriptTypes(root, protoFiles, jsOutFile);

  // ESM resolution fix: ensure explicit extension for Node ESM and default import
  const content = await readFile(jsOutFile, "utf8");
  let fixed = content.replace(
    /from\s+"protobufjs\/minimal";/,
    'from "protobufjs/minimal.js";',
  );
  fixed = fixed.replace(
    /import\s+\*\s+as\s+\$protobuf\s+from\s+"protobufjs\/minimal\.js";/,
    'import $protobuf from "protobufjs/minimal.js";',
  );
  if (fixed !== content) await writeFile(jsOutFile, fixed, "utf8");

  await generateTypeScriptDeclarationsPbts(root, jsOutFile, dtsOutFile);
}

/**
 * Parse a .proto file to extract a single service definition and method shapes
 * @param {string} protoPath - Absolute path to .proto file
 * @returns {{packageName:string, serviceName:string, methods:Array, namespaceName:string}} Parsed service info
 */
function parseProtoFile(protoPath) {
  const def = protoLoader.loadSync(protoPath, {
    includeDirs: [path.dirname(protoPath)],
    keepCase: true,
  });

  const serviceKey = Object.keys(def).find((key) => {
    const val = def[key];
    if (!val || typeof val !== "object") return false;
    const methods = Object.values(val);
    return (
      methods.length > 0 &&
      methods.every(
        (m) =>
          m &&
          typeof m === "object" &&
          "requestType" in m &&
          "responseType" in m,
      )
    );
  });

  if (!serviceKey) {
    return null; // Indicate no service for this proto (pure message proto)
  }

  const serviceDef = def[serviceKey];
  const parts = serviceKey.split(".");
  const serviceName = parts[parts.length - 1];
  const packageName = parts.slice(0, -1).join(".");

  const methods = Object.entries(serviceDef).map(([name, method]) => {
    const req = method.requestType.type;
    const res = method.responseType.type;
    const requestType = req.name;
    const responseType = res.name;

    // Find the correct fully qualified type name by comparing type structures
    /**
     * Find the namespace for a given type by comparing structure
     * @param {object} typeToFind - The type definition to find namespace for
     * @param {object} allTypes - All available type definitions
     * @returns {string} The namespace string for the type
     */
    function findTypeNamespace(typeToFind, allTypes) {
      // Find matching type definition by structure comparison
      for (const [key, typeDef] of Object.entries(allTypes)) {
        if (typeDef.type && typeDef.type.name === typeToFind.name) {
          const typeFields = typeDef.type.field || [];
          const targetFields = typeToFind.field || [];

          // Compare fields to see if structures match
          const fieldsMatch =
            typeFields.length === targetFields.length &&
            typeFields.every(
              (field, i) =>
                field.name === targetFields[i].name &&
                field.type === targetFields[i].type &&
                field.typeName === targetFields[i].typeName,
            );

          if (fieldsMatch) {
            const parts = key.split(".");
            return parts.length > 1
              ? parts.slice(0, -1).join(".")
              : packageName;
          }
        }
      }
      // Fallback to current package if no match found
      return packageName;
    }

    const requestTypeNs = findTypeNamespace(req, def);
    const responseTypeNs = findTypeNamespace(res, def);

    return {
      name,
      requestType,
      responseType,
      requestTypeNamespace: requestTypeNs,
      responseTypeNamespace: responseTypeNs,
      paramName: "req",
    };
  });

  // Collect all unique namespaces needed for imports
  const namespaces = new Set([packageName]);
  methods.forEach((method) => {
    namespaces.add(method.requestTypeNamespace);
    namespaces.add(method.responseTypeNamespace);
  });

  const importNamespaces = Array.from(namespaces).map((ns, index, array) => ({
    name: ns,
    isLast: index === array.length - 1,
  }));

  return {
    packageName,
    serviceName,
    methods,
    namespaceName: packageName,
    importNamespaces,
  };
}

/**
 * Generate TypeScript declarations using tsc from a JS file
 * @param {string} root - Project root directory (cwd for tsc)
 * @param {string} jsFile - Absolute path to input JS file
 * @param {string} outFile - Absolute path for resulting .d.ts
 * @returns {Promise<void>}
 */
async function generateTypeScriptDeclaration(root, jsFile, outFile) {
  const outputDir = path.dirname(outFile);
  const args = [
    "--declaration",
    "--emitDeclarationOnly",
    "--allowJs",
    "--outDir",
    outputDir,
    jsFile,
  ];

  const tsFile = path.join(outputDir, path.basename(jsFile, ".js") + ".d.ts");

  console.log(`Generating: ${tsFile}`);
  await run("npx", ["tsc", ...args], { cwd: root });

  if (tsFile !== outFile && fs.existsSync(tsFile)) {
    fs.renameSync(tsFile, outFile);
  }
}

/**
 * Render and write a service/client artifact for a given proto into a service dir
 * @param {"service"|"client"} kind - Artifact kind to generate
 * @param {string} protoPath - Absolute path to .proto file
 * @param {string} outputDir - Absolute directory path for output
 * @returns {Promise<void>}
 */
async function generateArtifact(kind, protoPath, outputDir) {
  const isService = kind === "service";
  const template = loadTemplate(kind);
  const parsed = parseProtoFile(protoPath);
  if (!parsed) return; // Skip non-service proto
  const { packageName, serviceName, methods, namespaceName, importNamespaces } =
    parsed;
  const rendered = mustache.render(template, {
    packageName,
    serviceName,
    methods,
    namespaceName,
    importNamespaces,
    className: `${serviceName}${isService ? "Base" : "Client"}`,
  });
  const output = await prettier.format(rendered, { parser: "babel" });
  const jsFile = path.join(outputDir, `${kind}.js`);
  const dtsFile = path.join(outputDir, `${kind}.d.ts`);

  console.log(`Generating: ${jsFile}`);
  fs.writeFileSync(jsFile, output);

  const projectRoot = path.resolve(__dirname, "..");
  try {
    await generateTypeScriptDeclaration(projectRoot, jsFile, dtsFile);
  } catch (error) {
    console.warn(
      `Warning: Could not generate TypeScript declarations for ${jsFile}:`,
      error.message,
    );
  }
}

/**
 * Generate artifacts for all services with matching directories
 * @param {"service"|"client"} kind - Artifact kind to generate
 * @returns {Promise<void>}
 */
async function runForKind(kind) {
  const projectRoot = path.resolve(__dirname, "..");
  const generatedRoot = path.join(projectRoot, "generated");
  const protoFiles = collectProtoFiles(projectRoot, {
    includeTools: true,
  }).filter((file) => !file.endsWith(path.sep + "common.proto"));

  for (const protoFile of protoFiles) {
    const basename = path.basename(protoFile, ".proto");
    const isTool = protoFile.includes(path.join(projectRoot, "tools"));
    const outDir = path.join(
      generatedRoot,
      isTool ? "tools" : "services",
      basename,
    );
    await fs.promises.mkdir(outDir, { recursive: true });
    await generateArtifact(kind, protoFile, outDir);
  }
}

/**
 * Print CLI usage help
 * @returns {void}
 */
function printUsage() {
  console.log(
    [
      "Usage:",
      `  node codegen.js --type`,
      `  node codegen.js --service  # Generate service bases`,
      `  node codegen.js --client   # Generate clients`,
      `  node codegen.js --all      # Generate all`,
    ].join("\n"),
  );
}

/**
 * CLI entry point
 * @returns {Promise<void>}
 */
async function main() {
  const flags = new Set(process.argv.slice(2));
  const doAll = flags.has("--all");
  const doTypes = doAll || flags.has("--type");
  const doServices = doAll || flags.has("--service");
  const doClients = doAll || flags.has("--client");

  if (!doTypes && !doServices && !doClients) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (doTypes) await runTypes();
  if (doServices) await runForKind("service");
  if (doClients) await runForKind("client");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
