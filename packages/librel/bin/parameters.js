#!/usr/bin/env node
/**
 * @file Retrieves CloudFormation stack outputs and formats as parameters.json
 * @example
 * # Retrieve outputs from stacks
 * echo '{"network-stack": ["VpcId"]}' | node scripts/stack-parameters.js --retrieve
 *
 * # Amend simple key-value map to parameters format
 * echo '{"VpcId": "vpc-123"}' | npx rel-parameters --amend
 *
 * # Save to file instead of stdout
 * echo '{"VpcId": "vpc-123"}' | npx rel-parameters --amend --file=parameters.json
 */

import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parseArgs } from "node:util";
import { createLogger } from "@copilot-ld/libtelemetry";
import { StackParameters } from "../parameters.js";

const logger = createLogger("rel-parameters");

/**
 * Resolves a file path relative to the working directory
 * @param {string} filename - Relative or absolute filename
 * @param {string} workingDir - Base working directory
 * @returns {string} Resolved path
 */
function resolveFilePath(filename, workingDir) {
  if (!filename) {
    return null;
  }
  // If filename is absolute, use it as-is
  if (filename.startsWith("/")) {
    return filename;
  }
  // Otherwise, resolve relative to the working directory
  return resolve(workingDir, filename);
}

/**
 * Reads JSON from stdin
 * @returns {Promise<object>} Parsed JSON object
 */
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}

/**
 * Outputs or saves parameters to file
 * @param {object[]} parameters - Array of parameter objects
 * @param {string|null} filename - Optional filename to save to
 * @param {string} workingDir - Base working directory
 */
function outputParameters(parameters, filename, workingDir) {
  if (!filename) {
    console.log(JSON.stringify(parameters, null, 2));
    return;
  }

  const resolvedPath = resolveFilePath(filename, workingDir);
  let existingParams = [];
  if (existsSync(resolvedPath)) {
    existingParams = JSON.parse(readFileSync(resolvedPath, "utf8"));
  }

  // Merge parameters, with new ones taking precedence
  const mergedParams = [...existingParams];
  for (const newParam of parameters) {
    const existingIndex = mergedParams.findIndex(
      (p) => p.ParameterKey === newParam.ParameterKey,
    );
    if (existingIndex >= 0) {
      mergedParams[existingIndex] = newParam;
    } else {
      mergedParams.push(newParam);
    }
  }

  writeFileSync(resolvedPath, JSON.stringify(mergedParams, null, 2));
}

/**
 * Main function to handle CloudFormation stack operations
 */
async function main() {
  try {
    const { values } = parseArgs({
      options: {
        retrieve: {
          type: "boolean",
          default: false,
        },
        amend: {
          type: "boolean",
          default: false,
        },
        file: {
          type: "string",
        },
      },
    });

    if (!values.retrieve && !values.amend) {
      throw new Error("Must specify either --retrieve or --amend");
    }

    if (values.retrieve && values.amend) {
      throw new Error("Cannot specify both --retrieve and --amend");
    }

    const workingDir = process.env.INIT_CWD || process.cwd();
    const input = await readStdin();
    const client = new CloudFormationClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    const stackParameters = new StackParameters(client, logger);

    const parameters = values.retrieve
      ? await stackParameters.retrieve(input)
      : stackParameters.amend(input);

    outputParameters(parameters, values.file, workingDir);
  } catch (error) {
    logger.error("main", "Parameter operation failed", {
      reason: error.message,
    });
    logger.exception("main", error);
    process.exit(1);
  }
}

main();
