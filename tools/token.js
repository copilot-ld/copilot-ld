/* eslint-env node */
import fs from "fs";

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/core";

import { ToolConfig } from "@copilot-ld/libconfig";

const config = new ToolConfig("token");

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

  fs.writeFileSync(".ghtoken", token);
  console.log("Token saved to .ghtoken");

  return token;
}

main();
