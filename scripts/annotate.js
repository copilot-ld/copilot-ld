#!/usr/bin/env node
/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { common } from "@copilot-ld/libtype";

const config = await createScriptConfig("annotate");

/**
 * Main function to convert text to HTML with Schema.org microdata
 * Reads text from stdin, uses Copilot to convert it to valid HTML with Schema.org microdata
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
      content: `You are an expert in HTML and Schema.org microdata. Convert the
		provided text into valid class-less HTML with appropriate Schema.org
		microdata attributes. Use only valid Schema.org types and properties
		from https://schema.org. Ensure all microdata uses proper itemscope,
		itemtype, and itemprop attributes. Output only the HTML without any
		explanation or markdown code blocks.`,
    }),
    common.Message.fromObject({
      role: "user",
      content: input,
    }),
  ];

  const response = await client.createCompletions(messages);

  if (response.choices && response.choices.length > 0) {
    const htmlContent = response.choices[0].message.content?.text || "";
    console.log(htmlContent);
  } else {
    console.error("Error: No response from Copilot");
    process.exit(1);
  }
}

main();
