#!/usr/bin/env node
/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { Repl } from "@copilot-ld/librepl";
import { createResourceIndex } from "@copilot-ld/libresource";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { createStorage } from "@copilot-ld/libstorage";
import { VectorIndex } from "@copilot-ld/libvector";

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
const repl = new Repl(createTerminalFormatter(), {
  help: `Usage: <search query>`,

  setup: async () => {
    const vectorStorage = createStorage("vectors");
    vectorIndex = new VectorIndex(vectorStorage, "content.jsonl");

    resourceIndex = createResourceIndex("resources");
  },

  state: {
    limit: 0,
    threshold: 0,
  },

  commands: {
    limit: (args, state) => {
      if (args.length === 0) {
        return "Usage: /limit <number>";
      }
      const value = parseInt(args[0]);
      if (isNaN(value) || value < 0) {
        return `Error: limit must be a non-negative number`;
      }
      state.limit = value;
    },
    threshold: (args, state) => {
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

  onLine: performSearch,
});

repl.start();
