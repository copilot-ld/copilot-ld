#!/usr/bin/env node
/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { Repl } from "@copilot-ld/librepl";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";
import { VectorIndex } from "@copilot-ld/libvector/index/vector.js";

const usage = `**Usage:** <search query>

Perform semantic vector search over indexed resources using embeddings.
Search either content or descriptor representations with configurable thresholds and limits.

**Examples:**

    echo "pharmaceutical research" | npm -s run cli:search
    echo "regulatory compliance" | npm -s run cli:search -- --threshold 0.7 --limit 10
    echo "clinical trials" | npm -s run cli:search -- --representation descriptor --threshold 0.5`;

// Configuration
const config = await createScriptConfig("search");

// Global state
/** @type {VectorIndex} */
let vectorIndex;
/** @type {import("@copilot-ld/libresource").ResourceIndex} */
let resourceIndex;

/**
 * Performs a semantic search using embeddings
 * @param {string} prompt - The search query text
 * @param {object} state - REPL state containing limit and threshold settings
 * @returns {Promise<string>} Formatted search results as markdown
 */
async function performSearch(prompt, state) {
  const { limit, threshold } = state;

  const llm = createLlm(await config.githubToken());
  const embeddings = await llm.createEmbeddings([prompt]);

  const identifiers = await vectorIndex.queryItems(embeddings[0].embedding, {
    threshold: threshold,
    limit: limit > 0 ? limit : 0,
  });

  const resources = await resourceIndex.get(identifiers, "common.System.root");

  let output = ``;
  output += `Searching content index\n\n`;
  identifiers.forEach((identifier, i) => {
    const resource = resources.find((r) => r.id.name === identifier.name);
    if (!resource) return;

    const text = resource.content;

    output += `# ${i + 1}: ${identifier} (${identifier.score.toFixed(4)})\n\n`;
    output += `\n\n\`\`\`json\n${text.substring(0, 500)}\n\`\`\`\n\n`;
  });

  return output;
}

// Create REPL with dependency injection
const repl = new Repl({
  usage,

  setup: async (_state) => {
    const vectorStorage = createStorage("vectors");
    vectorIndex = new VectorIndex(vectorStorage);
    resourceIndex = createResourceIndex("resources");
  },

  state: {
    limit: 0,
    threshold: 0,
  },

  commands: {
    limit: {
      usage: "Set maximum number of results to return (0 for unlimited)",
      handler: (args, state) => {
        if (args.length === 0) {
          return "Usage: /limit <number>";
        }
        const value = parseInt(args[0]);
        if (isNaN(value) || value < 0) {
          return `Error: limit must be a non-negative number`;
        }
        state.limit = value;
      },
    },
    threshold: {
      usage: "Set similarity threshold (0.0 to 1.0)",
      handler: (args, state) => {
        if (args.length === 0) {
          return "Usage: /threshold <number>";
        }
        const value = parseFloat(args[0]);
        if (isNaN(value) || value < 0 || value > 1) {
          return `Error: threshold must be a number between 0.0 and 1.0`;
        }
        state.threshold = value;
      },
    },
  },

  onLine: performSearch,
});

repl.start();
