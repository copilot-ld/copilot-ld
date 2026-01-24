#!/usr/bin/env node
import { createLlmApi } from "@copilot-ld/libllm";
import { createScriptConfig } from "@copilot-ld/libconfig";

const config = await createScriptConfig("embed");

/**
 * Main function to create embeddings from stdin input
 * Reads text from stdin, creates an embedding, and outputs the vector
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();

  const client = createLlmApi(
    await config.llmToken(),
    undefined,
    config.llmBaseUrl(),
    config.embeddingBaseUrl(),
  );
  const embeddings = await client.createEmbeddings([input]);

  console.log(JSON.stringify(embeddings.data[0].embedding));
}

main();
