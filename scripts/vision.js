#!/usr/bin/env node
/* eslint-env node */
import { createScriptConfig } from "@copilot-ld/libconfig";
import { createLlm } from "@copilot-ld/libcopilot";
import { parseArgs } from "node:util";

/**
 * Main function to process image and output description
 */
async function main() {
  const { values } = parseArgs({
    options: {
      image: {
        type: "string",
        short: "i",
      },
      prompt: {
        type: "string",
        short: "p",
        default: "Describe the content of this image in detail.",
      },
      model: {
        type: "string",
        short: "m",
        default: "gpt-4o",
      },
    },
  });

  if (!values.image) {
    console.error("Error: --image argument is required");
    console.error(
      "Usage: node scripts/vision.js --image <path-to-image> --prompt <optional-prompt> --model <optional-model>",
    );
    process.exit(1);
  }

  const config = await createScriptConfig("vision");
  const llm = createLlm(await config.githubToken(), values.model);
  const description = await llm.imageToText(
    values.image,
    values.prompt,
    values.model,
  );
  console.log(description);
}

await main();
