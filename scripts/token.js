/* eslint-env node */
import fs from "fs";
import path from "path";

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/core";

import { ScriptConfig } from "@copilot-ld/libconfig";
import { updateEnvFile } from "@copilot-ld/libutil";

const config = await ScriptConfig.create("token");

/**
 * Main function to authenticate with GitHub using OAuth device flow
 * and save the resulting token to a file
 * @returns {Promise<string>} The GitHub authentication token
 */
async function main() {
  const octokit = new Octokit({
    authStrategy: createOAuthDeviceAuth,
    auth: {
      clientId: config.githubClientId(),
      onVerification: (verification) => {
        console.log(`Visit: ${verification.verification_uri}`);
        console.log(`Code: ${verification.user_code}`);
      },
    },
  });

  const { token } = await octokit.auth({ type: "oauth-device" });

  // Save token to config/.github_token (existing behavior)
  const configDir = "config";
  const tokenPath = path.join(configDir, ".github_token");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(tokenPath, token);
  console.log("Token saved to config/.github_token");

  // Also save token to .env file
  try {
    await updateEnvFile("GITHUB_TOKEN", token);
    console.log("GITHUB_TOKEN was updated in .env");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
