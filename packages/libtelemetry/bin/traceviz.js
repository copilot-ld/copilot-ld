#!/usr/bin/env node
/* eslint-env node */
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { createStorage } from "@copilot-ld/libstorage";
import { parseArgs } from "node:util";

import { TraceIndex } from "../index.js";
import { TraceVisualizer } from "../visualizer.js";

/**
 * Prints usage information
 */
function printUsage() {
  console.log(`Usage: traceviz [options]

Visualizes traces from the trace index in a format optimized for AI agent analysis.

Options:
  -t, --trace-id <id>      Filter traces by trace ID
  -r, --resource-id <id>   Filter traces by resource ID
  -m, --markdown           Output plain markdown without terminal formatting
  -h, --help               Show this help message

Examples:
  traceviz --trace-id 0f53069dbc62d
  traceviz --resource-id "common.Conversation.ed232748-ac97-4b94-b784-3b1ff4872f62"
  traceviz --markdown > trace.md
  traceviz
`);
}

/**
 * Visualizes traces from the trace index
 * @returns {Promise<void>}
 */
async function main() {
  const { values } = parseArgs({
    options: {
      "trace-id": {
        type: "string",
        short: "t",
      },
      "resource-id": {
        type: "string",
        short: "r",
      },
      markdown: {
        type: "boolean",
        short: "m",
      },
      help: {
        type: "boolean",
        short: "h",
      },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const traceStorage = createStorage("traces");
  const traceIndex = new TraceIndex(traceStorage, "index.jsonl");
  const visualizer = new TraceVisualizer(traceIndex);

  const filter = {};
  if (values["trace-id"]) {
    filter.trace_id = values["trace-id"];
  }
  if (values["resource-id"]) {
    filter.resource_id = values["resource-id"];
  }

  const visualization = await visualizer.visualize(filter);
  
  // Output plain markdown or terminal-formatted version
  if (values.markdown) {
    console.log(visualization);
  } else {
    const formatter = createTerminalFormatter();
    
    // Temporarily suppress stderr to hide marked-terminal warnings about unknown languages
    const originalStderrWrite = process.stderr.write;
    process.stderr.write = () => {};
    
    const formatted = formatter.format(visualization);
    
    // Restore stderr
    process.stderr.write = originalStderrWrite;
    
    console.log(formatted);
  }
}

main().catch((error) => {
  console.error("Trace visualization failed:", error);
  process.exit(1);
});
