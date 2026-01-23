#!/usr/bin/env node
import { updateEnvFile, generateSecret } from "@copilot-ld/libsecret";
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

/**
 * Main function to generate and update secrets
 *
 * Usage:
 * env-secrets.js                             # Updates .env file
 * env-secrets.js --output $PATH              # Writes key=value pairs to file
 * env-secrets.js --add-mask --output $PATH   # Prints mask commands and writes to file
 */
async function main() {
  const { values } = parseArgs({
    options: {
      output: {
        type: "string",
      },
      "add-mask": {
        type: "boolean",
        default: false,
      },
    },
  });

  const serviceSecret = generateSecret();
  const jwtSecret = generateSecret(32);
  const databasePassword = generateSecret(16);

  if (values.output) {
    // Write key=value pairs to output file
    const content = `service_secret=${serviceSecret}\njwt_secret=${jwtSecret}\ndatabase_password=${databasePassword}\n`;
    await writeFile(values.output, content);

    if (values["add-mask"]) {
      // Print GitHub Actions mask commands to stdout
      console.log(`::add-mask::${serviceSecret}`);
      console.log(`::add-mask::${jwtSecret}`);
      console.log(`::add-mask::${databasePassword}`);
    }
    return;
  }

  // Default: update .env file
  await updateEnvFile("SERVICE_SECRET", serviceSecret);
  await updateEnvFile("JWT_SECRET", jwtSecret);
  await updateEnvFile("DATABASE_PASSWORD", databasePassword);

  console.log("SERVICE_SECRET was updated in .env");
  console.log("JWT_SECRET was updated in .env");
  console.log("DATABASE_PASSWORD was updated in .env");
}

main();
