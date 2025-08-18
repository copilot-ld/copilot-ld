#!/usr/bin/env node

import { execFile } from "node:child_process";
import protoLoader from "@grpc/proto-loader";
import fs from "fs";
import mustache from "mustache";
import path from "path";
import prettier from "prettier";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Single read of template
const TEMPLATE_PATH = path.join(__dirname, "service.js.mustache");
const TEMPLATE = fs.readFileSync(TEMPLATE_PATH, "utf8");

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
 * Generate TypeScript declarations using tsc
 * @param {string} root - Project root directory
 * @param {string} jsFile - Input JavaScript file path
 * @param {string} outFile - Output .d.ts file path
 */
async function generateTypeScriptDeclarations(root, jsFile, outFile) {
  const outputDir = path.dirname(outFile);
  const args = [
    "--declaration",
    "--emitDeclarationOnly",
    "--allowJs",
    "--outDir",
    outputDir,
    jsFile,
  ];

  try {
    await run("npx", ["tsc", ...args], { cwd: root });

    // The generated file will be named after the input file
    const generatedFile = path.join(
      outputDir,
      path.basename(jsFile, ".js") + ".d.ts",
    );

    // If the generated file has a different name than expected, rename it
    if (generatedFile !== outFile && fs.existsSync(generatedFile)) {
      fs.renameSync(generatedFile, outFile);
    }
  } catch (error) {
    throw new Error(`TypeScript compilation failed: ${error.message}`);
  }
}

/**
 * Extract field names from a proto message for documentation purposes
 * @param {object} f - DescriptorProto.field item
 * @returns {{fieldName:string}} Field context for template rendering
 */
function mapField(f) {
  return { fieldName: f.name };
}

/**
 * Parses a proto file to extract service and message definitions with field information
 * Uses @grpc/proto-loader for service discovery and field metadata
 * @param {string} protoPath - Path to the proto file
 * @returns {object} Service definition with methods, messages and field information
 */
function parseProtoFile(protoPath) {
  // Load definition using proto-loader (keeps original behavior)
  const def = protoLoader.loadSync(protoPath, {
    includeDirs: [path.dirname(protoPath)],
    keepCase: true,
  });

  // Identify first service-like entry
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

  if (!serviceKey)
    throw new Error(`No service definition found in ${protoPath}`);

  const serviceDef = def[serviceKey];
  const parts = serviceKey.split(".");
  const serviceName = parts[parts.length - 1];
  const packageName = parts.slice(0, -1).join(".");

  const methods = Object.entries(serviceDef).map(([name, method]) => {
    const req = method.requestType.type;
    const res = method.responseType.type;
    const requestType = req.name;
    const responseType = res.name;

    const fields = [...(req.field || [])]
      .sort((a, b) => a.number - b.number)
      .map(mapField);

    return {
      name,
      requestType,
      responseType,
      requestTypeNs: `${packageName}.${requestType}`,
      responseTypeNs: `${packageName}.${responseType}`,
      requestTypeExpr: `${packageName}.${requestType}`,
      responseTypeExpr: `${packageName}.${responseType}`,
      fields,
      fieldList: fields.map((f) => f.fieldName).join(", "),
      paramName: "req",
    };
  });

  // Only collect request and response types for typedef imports
  const requestResponseTypes = new Set();
  methods.forEach((m) => {
    requestResponseTypes.add(`${packageName}.${m.requestType}`);
    requestResponseTypes.add(`${packageName}.${m.responseType}`);
  });

  return {
    packageName,
    serviceName,
    methods,
    namespaceName: packageName,
    className: `${serviceName}Base`,
  };
}

/**
 * Generate base class for a single service
 * @param {string} protoPath - Path to the proto file
 * @param {string} outputDir - Output directory for the base class
 */
async function generateServiceBase(protoPath, outputDir) {
  const serviceDefinition = parseProtoFile(protoPath);
  const rendered = mustache.render(TEMPLATE, serviceDefinition);
  const output = await prettier.format(rendered, { parser: "babel" });
  const jsFile = path.join(outputDir, "types.js");
  const dtsFile = path.join(outputDir, "types.d.ts");

  fs.writeFileSync(jsFile, output);

  // Generate TypeScript declarations from the JavaScript file
  const projectRoot = path.resolve(__dirname, "..");
  try {
    await generateTypeScriptDeclarations(projectRoot, jsFile, dtsFile);
  } catch (error) {
    console.warn(
      `Warning: Could not generate TypeScript declarations for ${jsFile}:`,
      error.message,
    );
  }
}

/**
 * Main function to generate all service base classes
 */
async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const protoDir = path.join(projectRoot, "proto");
  const servicesDir = path.join(projectRoot, "services");

  const protoFiles = fs
    .readdirSync(protoDir)
    .filter((file) => file.endsWith(".proto") && file !== "common.proto")
    .map((file) => path.join(protoDir, file));

  for (const protoFile of protoFiles) {
    const basename = path.basename(protoFile, ".proto");
    const serviceDir = path.join(servicesDir, basename);

    if (fs.existsSync(serviceDir))
      await generateServiceBase(protoFile, serviceDir);
  }
}

main();
