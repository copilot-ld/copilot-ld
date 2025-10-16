/* eslint-env node */
import { ScriptConfig } from "@copilot-ld/libconfig";
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
    },
  });

  if (!values.image) {
    console.error("Error: --image argument is required");
    console.error("Usage: node scripts/vision.js --image <path-to-image>");
    process.exit(1);
  }

  const config = await ScriptConfig.create("vision");
  const llm = createLlm(await config.githubToken(), "gpt-4o");
  const description = await llm.imageToText(values.image);
  console.log(description);
}

await main();
