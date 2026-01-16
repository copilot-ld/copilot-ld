#!/usr/bin/env node
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createLlmApi } from "@copilot-ld/libllm";

const usage = `Usage: npm -s run cli:window -- <resource_id> | npm -s run cli:completion

Reads a memory window from stdin and sends it to the LLM API for completion.
Outputs the completion response to stdout.

Example:
  npm -s run cli:window -- common.Conversation.abc123 | npm -s run cli:completion`;

const config = await createServiceConfig("agent");
const llm = createLlmApi(
  await config.llmToken(),
  undefined,
  config.llmBaseUrl(),
);

/**
 * Main entry point - reads window JSON from stdin and sends to LLM
 */
async function main() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  if (!input.trim()) {
    console.error(usage);
    process.exit(1);
  }

  const window = JSON.parse(input);
  const result = await llm.createCompletions(window);
  console.log(JSON.stringify(result, null, 2));
}

main();
