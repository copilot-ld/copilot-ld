#!/usr/bin/env node
/**
 * @file Retrieves CloudFormation stack outputs and formats as parameters.json
 * @example
 * # Retrieve outputs from stacks
 * echo '{"network-stack": ["VpcId"]}' | node scripts/stack-parameters.js --retrieve
 *
 * # Amend simple key-value map to parameters format
 * echo '{"VpcId": "vpc-123"}' | node scripts/stack-parameters.js --amend
 *
 * # Save to file instead of stdout
 * echo '{"VpcId": "vpc-123"}' | node scripts/stack-parameters.js --amend --file=parameters.json
 */

import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { StackParameters } from "../packages/librel/parameters.js";

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
 * Parses command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    retrieve: args.includes("--retrieve"),
    amend: args.includes("--amend"),
    file: args.find((arg) => arg.startsWith("--file="))?.split("=")[1] || null,
  };
}

/**
 * Outputs or saves parameters to file
 * @param {object[]} parameters - Array of parameter objects
 * @param {string|null} filename - Optional filename to save to
 */
function outputParameters(parameters, filename) {
  if (!filename) {
    console.log(JSON.stringify(parameters, null, 2));
    return;
  }

  let existingParams = [];
  if (existsSync(filename)) {
    existingParams = JSON.parse(readFileSync(filename, "utf8"));
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

  writeFileSync(filename, JSON.stringify(mergedParams, null, 2));
}

/**
 * Main function to handle CloudFormation stack operations
 */
async function main() {
  try {
    const args = parseArgs();

    if (!args.retrieve && !args.amend) {
      throw new Error("Must specify either --retrieve or --amend");
    }

    if (args.retrieve && args.amend) {
      throw new Error("Cannot specify both --retrieve and --amend");
    }

    const input = await readStdin();
    const client = new CloudFormationClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    const stackParameters = new StackParameters(client);

    const parameters = args.retrieve
      ? await stackParameters.retrieve(input)
      : stackParameters.amend(input);

    outputParameters(parameters, args.file);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
