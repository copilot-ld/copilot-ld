#!/usr/bin/env node
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createClient } from "@copilot-ld/librpc";
import { memory } from "@copilot-ld/libtype";

const usage = `Usage: make cli-window ARGS="<resource_id>"

Fetches a memory window for the given resource ID and outputs the JSON to stdout.

Example:
  make cli-window ARGS="common.Conversation.abc123"
  make cli-window ARGS="common.Conversation.abc123" | make cli-completion`;

const config = await createServiceConfig("agent");
const memoryClient = await createClient("memory");

/**
 * Fetches and outputs a memory window for the given resource ID
 */
async function main() {
  const resource_id = process.argv[2];

  if (!resource_id) {
    console.error(usage);
    process.exit(1);
  }

  const request = memory.WindowRequest.fromObject({
    resource_id,
    model: config.model,
  });
  const window = await memoryClient.GetWindow(request);

  console.log(JSON.stringify(window, null, 2));
  process.exit(0);
}

main();
