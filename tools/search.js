/* eslint-env node */
import readline from "readline";

import { Copilot } from "@copilot-ld/libcopilot";
import { ToolConfig } from "@copilot-ld/libconfig";
import { Policy } from "@copilot-ld/libpolicy";
import { Repl } from "@copilot-ld/librepl";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { storageFactory } from "@copilot-ld/libstorage";
import { VectorIndex } from "@copilot-ld/libvector";

// Configuration
const config = await ToolConfig.create("search");

// Global state
/** @type {VectorIndex} */
let vectorIndex;
/** @type {ResourceIndex} */
let resourceIndex;

/**
 * Performs a semantic search using embeddings
 * @param {string} prompt - The search query text
 * @param {object} state - REPL state containing limit and threshold settings
 * @returns {Promise<string>} Formatted search results as markdown
 */
async function performSearch(prompt, state) {
  const { limit, threshold } = state;

  const client = new Copilot(await config.githubToken());
  const embeddings = await client.createEmbeddings([prompt]);

  const resources = await vectorIndex.queryItems(
    embeddings[0].embedding,
    threshold(),
    limit() > 0 ? limit() : 0,
  );

  const ids = resources.map((resource) => resource.id);
  const actor = "urn:copilot-ld:tool:search"; // Default actor for search tool
  const instances = await resourceIndex.get(actor, ids);

  let output = ``;
  resources.forEach((resource, i) => {
    const instance = instances.find((i) => i.meta.id === resource.id);
    if (!instance) return;

    // TODO: .toMessage ?
    const message = instance.toMessage();
    output += `# ${i + 1} Score: ${resource.score.toFixed(4)}\n\n`;
    output += `${resource.id}\n`;
    output += `\n\n\`\`\`json\n${message.content.substring(0, 200)}\n\`\`\`\n\n`;
  });

  return output;
}

// Create REPL with dependency injection
const repl = new Repl(readline, process, createTerminalFormatter(), {
  setup: async () => {
    const vectorStorage = storageFactory("vectors");
    vectorIndex = new VectorIndex(vectorStorage);
    
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
  },
  onLine: performSearch,
});

repl.start();
