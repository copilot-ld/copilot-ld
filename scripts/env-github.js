#!/usr/bin/env node
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/core";

import { createScriptConfig } from "@copilot-ld/libconfig";
import { updateEnvFile } from "@copilot-ld/libsecret";

const config = await createScriptConfig("gh-token");

/**
 * Main function to authenticate with GitHub using OAuth device flow
 * and save the resulting token to a file with 'models' scope
 * @returns {Promise<string>} The GitHub authentication token
 */
async function main() {
  const octokit = new Octokit({
    authStrategy: createOAuthDeviceAuth,
    auth: {
      clientId: config.ghClientId(),
      scopes: ["models"],
      onVerification: (verification) => {
        console.log(`Visit: ${verification.verification_uri}`);
        console.log(`Code: ${verification.user_code}`);
      },
    },
  });

  const { token } = await octokit.auth({ type: "oauth-device" });
  await updateEnvFile("GITHUB_TOKEN", token);
  await updateEnvFile("LLM_TOKEN", token);
  console.log("GITHUB_TOKEN and LLM_TOKEN were updated in .env");
}

main();
