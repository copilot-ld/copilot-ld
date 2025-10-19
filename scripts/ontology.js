#!/usr/bin/env node
/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { ScriptConfig } from "@copilot-ld/libconfig";
import { common } from "@copilot-ld/libtype";

const config = await ScriptConfig.create("ontology");

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

  const client = createLlm(await config.githubToken());

  const messages = [
    common.Message.fromObject({
      role: "system",
      content: `You are an expert in SHACL (Shapes Constraint Language) and RDF ontology design. 
Analyze the provided text and generate a SHACL ontology that accurately describes the concepts, 
entities, and relationships present in the text. Use proper SHACL shapes with appropriate constraints, 
properties, and datatypes. Follow SHACL best practices and use the sh: namespace for SHACL vocabulary. 
Output only the SHACL ontology in Turtle format without any explanation or markdown code blocks.`,
    }),
    common.Message.fromObject({
      role: "user",
      content: input,
    }),
  ];

  const response = await client.createCompletions(messages);

  if (response.choices && response.choices.length > 0) {
    const ontology = response.choices[0].message.content?.text || "";
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
