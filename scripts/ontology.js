#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createLlmApi } from "@copilot-ld/libllm";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { common } from "@copilot-ld/libtype";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = await createScriptConfig("ontology");

/**
 * Main function to generate SHACL ontology from input text
 * Reads text from stdin, uses Copilot to generate a SHACL ontology that describes the content
 * @returns {Promise<void>}
 */
async function main() {
  const input = (await process.stdin.toArray()).join("").trim();

  if (!input) {
    console.error("Error: No input provided");
    process.exit(1);
  }

  // Load the system prompt from external file
  const promptPath = join(__dirname, "ontology-prompt.md");
  const systemPrompt = await readFile(promptPath, "utf-8");

  const client = createLlmApi(
    await config.llmToken(),
    "gpt-5",
    config.llmBaseUrl(),
    null, // embeddingBaseUrl - not used for completions
    0.3, // temperature
  );

  const messages = [
    common.Message.fromObject({
      role: "system",
      content: systemPrompt,
    }),
    common.Message.fromObject({
      role: "user",
      content: input,
    }),
  ];

  // Use higher max_tokens to ensure all shapes are generated
  const response = await client.createCompletions({
    messages,
    max_tokens: 16000, // increased to generate all shapes
  });

  if (response.choices && response.choices.length > 0) {
    let ontology = response.choices[0].message.content?.text || "";

    // Strip markdown code fences if present
    ontology = ontology.replace(/^```(?:turtle)?[\r\n]+/gm, "");
    ontology = ontology.replace(/[\r\n]+```$/gm, "");
    ontology = ontology.trim();

    console.log(ontology);
  } else {
    console.error("Error: No response from Copilot");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
