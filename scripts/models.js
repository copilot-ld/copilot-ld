#!/usr/bin/env node
/* eslint-env node */
import { Copilot } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";

const config = await createScriptConfig("models");

/**
 * Main function to list available models from the copilot service
 * Fetches models and outputs them as JSON without descriptions
 * @returns {Promise<void>}
 */
async function main() {
  const client = new Copilot(await config.githubToken());
  const models = await client.listModels();

  const cleanedModels = models.map((model) => {
    const { description: _description, ...modelWithoutDescription } = model;
    return modelWithoutDescription;
  });

  console.log(JSON.stringify(cleanedModels, null, 2));
}

main();
