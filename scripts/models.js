#!/usr/bin/env node
import { createLlmApi } from "@copilot-ld/libllm";
import { createScriptConfig } from "@copilot-ld/libconfig";

const config = await createScriptConfig("models");

/**
 * Main function to list available models from the LLM service
 * Fetches models and outputs them as JSON without descriptions
 * @returns {Promise<void>}
 */
async function main() {
  const client = createLlmApi(
    await config.llmToken(),
    undefined,
    config.llmBaseUrl(),
    config.embeddingBaseUrl(),
  );
  const models = await client.listModels();

  const cleanedModels = models.map((model) => {
    const { description: _description, ...modelWithoutDescription } = model;
    return modelWithoutDescription;
  });

  console.log(JSON.stringify(cleanedModels, null, 2));
}

main();
