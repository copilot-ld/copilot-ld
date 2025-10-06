/* eslint-env node */
import crypto from "crypto";
import { updateEnvFile } from "@copilot-ld/libutil";

/**
 * Generates a cryptographically secure random secret key
 * @param {number} length - Length of the secret in bytes (default: 32)
 * @returns {string} Hex-encoded random secret
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Main function to generate and update secret in .env file
 */
async function main() {
  const args = process.argv.slice(2);
  const outputOnly = args.includes("--stdout");

  const secret = generateSecret();

  if (outputOnly) {
    // Just output the secret for use in scripts/CI
    console.log(secret);
    return;
  }

  try {
    await updateEnvFile("SERVICE_SECRET", secret);
    console.log("SERVICE_SECRET was updated in .env");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
