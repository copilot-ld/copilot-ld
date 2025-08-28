/* eslint-env node */
import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * Generates a cryptographically secure random secret key
 * @param {number} length - Length of the secret in bytes (default: 32)
 * @returns {string} Hex-encoded random secret
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Updates or creates SERVICE_AUTH_SECRET in .env file
 * @param {string} secret - The secret to write
 * @param {string} envPath - Path to .env file
 */
function updateEnvFile(secret, envPath) {
  let envContent = "";

  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  const secretLine = `SERVICE_AUTH_SECRET=${secret}`;
  const lines = envContent.split("\n");
  let found = false;

  // Look for existing SERVICE_AUTH_SECRET line
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].startsWith("SERVICE_AUTH_SECRET=") ||
      lines[i].startsWith("# SERVICE_AUTH_SECRET=")
    ) {
      lines[i] = secretLine;
      found = true;
      break;
    }
  }

  // If not found, add it to the end
  if (!found) {
    if (envContent && !envContent.endsWith("\n")) {
      lines.push("");
    }
    lines.push(secretLine);
  }

  // Write back to file
  fs.writeFileSync(envPath, lines.join("\n"));
}

/**
 * Main function to generate and update secret in .env file
 */
function main() {
  const secret = generateSecret();
  const envPath = path.join(process.cwd(), "config/.env");

  try {
    updateEnvFile(secret, envPath);
    console.log("config/.env file updated with new authentication secret");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
