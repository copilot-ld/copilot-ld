#!/usr/bin/env node
/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";

const config = await createScriptConfig("embed");

/**
 * Main function to create embeddings from stdin input
 * Reads text from stdin, creates an embedding, and outputs the vector
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();

  const client = createLlm(await config.githubToken());
  const embeddings = await client.createEmbeddings([input]);

  console.log(JSON.stringify(embeddings[0].embedding));
}

main();
