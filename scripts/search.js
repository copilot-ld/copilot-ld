/* eslint-env node */
import readline from "readline";

import { llmFactory } from "@copilot-ld/libcopilot";
import { ScriptConfig } from "@copilot-ld/libconfig";
import { Policy } from "@copilot-ld/libpolicy";
import { Repl } from "@copilot-ld/librepl";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { storageFactory } from "@copilot-ld/libstorage";
import { VectorIndex } from "@copilot-ld/libvector";

// Configuration
const config = await ScriptConfig.create("search");

// Global state
/** @type {VectorIndex} */
let contentIndex;
/** @type {VectorIndex} */
let descriptorIndex;
/** @type {ResourceIndex} */
let resourceIndex;

/**
 * Performs a semantic search using embeddings
 * @param {string} prompt - The search query text
 * @param {object} state - REPL state containing limit, threshold, and index settings
 * @returns {Promise<string>} Formatted search results as markdown
 */
async function performSearch(prompt, state) {
  const { limit, threshold, index } = state;

  // Select the appropriate index based on index
  const targetIndex = index() === "descriptor" ? descriptorIndex : contentIndex;

  const llm = llmFactory(await config.githubToken());
  const embeddings = await llm.createEmbeddings([prompt]);

  const identifiers = await targetIndex.queryItems(embeddings[0].embedding, {
    threshold: threshold(),
    limit: limit() > 0 ? limit() : 0,
  });

  const resources = await resourceIndex.get("common.System.root", identifiers);

  let output = ``;
  output += `Searching: ${index()} index\n\n`;
  identifiers.forEach((identifier, i) => {
    const resource = resources.find((r) => r.id.name === identifier.name);
    if (!resource) return;

    // Not all resources have content, fallback to descriptor
    const text = resource[index()]
      ? String(resource[index()])
      : String(resource.descriptor);

    output += `# ${i + 1} Score: ${identifier.score.toFixed(4)}\n\n`;
    output += `${identifier}\n`;
    output += `\n\n\`\`\`json\n${text.substring(0, 500)}\n\`\`\`\n\n`;
  });

  return output;
}

// Create REPL with dependency injection
const repl = new Repl(readline, process, createTerminalFormatter(), {
  setup: async () => {
    const vectorStorage = storageFactory("vectors");
    contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
    descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");

    const resourceStorage = storageFactory("resources");
    const policyStorage = storageFactory("policies");
    const policy = new Policy(policyStorage);
    resourceIndex = new ResourceIndex(resourceStorage, policy);
  },
  state: {
    limit: {
      initial: 0,
      description: "Maximum number of results (0 for no limit)",
    },
    threshold: {
      initial: 0,
      description: "Minimum score threshold (0.0 - 1.0)",
    },
    index: {
      initial: "content",
      description: "Index to search: 'content' or 'descriptor'",
    },
  },
  onLine: performSearch,
});

repl.start();
