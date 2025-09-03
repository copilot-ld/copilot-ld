/* eslint-env node */
import { Copilot } from "@copilot-ld/libcopilot";
import { ScriptConfig } from "@copilot-ld/libconfig";

const config = await ScriptConfig.create("embed");

/**
 * Main function to create embeddings from stdin input
 * Reads text from stdin, creates an embedding, and outputs the vector
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();

  const client = new Copilot(await config.githubToken());
  const embeddings = await client.createEmbeddings([input]);

  console.log(JSON.stringify(embeddings[0].embedding));
}

main();
