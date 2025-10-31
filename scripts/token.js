#!/usr/bin/env node
/* eslint-env node */
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/core";

import { createScriptConfig } from "@copilot-ld/libconfig";
import { updateEnvFile } from "@copilot-ld/libutil";

const config = await createScriptConfig("token");

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
  await updateEnvFile("GITHUB_TOKEN", token);
  console.log("GITHUB_TOKEN was updated in .env");
}

main();
