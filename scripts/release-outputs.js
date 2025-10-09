#!/usr/bin/env node
/**
 * @file Retrieves CloudFormation stack outputs and formats as parameters.json
 * @example
 * echo '{"network-stack": ["VpcId"]}' | node scripts/release-outputs.js
 */

import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { StackOutputs } from "../packages/librel/outputs.js";

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
 * Main function to handle CloudFormation stack outputs
 * @returns {object} Stack outputs as key-value pairs
 */
async function main() {
  try {
    const map = await readStdin();

    const client = new CloudFormationClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    const stackOutputs = new StackOutputs(client);

    const parameters = await stackOutputs.retrieve(map);
    console.log(JSON.stringify(parameters, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
