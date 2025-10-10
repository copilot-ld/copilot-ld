/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { ScriptConfig } from "@copilot-ld/libconfig";
import { Policy } from "@copilot-ld/libpolicy";
import { Repl } from "@copilot-ld/librepl";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { createStorage } from "@copilot-ld/libstorage";
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

  // Select the appropriate index
  const targetIndex = index === "descriptor" ? descriptorIndex : contentIndex;

  const llm = createLlm(await config.githubToken());
  const embeddings = await llm.createEmbeddings([prompt]);

  const identifiers = await targetIndex.queryItems(embeddings[0].embedding, {
    threshold: threshold,
    limit: limit > 0 ? limit : 0,
  });

  const resources = await resourceIndex.get("common.System.root", identifiers);

  let output = ``;
  output += `Searching: ${index} index\n\n`;
  identifiers.forEach((identifier, i) => {
    const resource = resources.find((r) => r.id.name === identifier.name);
    if (!resource) return;

    // Not all resources have content, fallback to descriptor
    const text = resource[index]
      ? String(resource[index])
      : String(resource.descriptor);

    output += `# ${i + 1} Score: ${identifier.score.toFixed(4)}\n\n`;
    output += `${identifier}\n`;
    output += `\n\n\`\`\`json\n${text.substring(0, 500)}\n\`\`\`\n\n`;
  });

  return output;
}

// Create REPL with dependency injection
const repl = new Repl(createTerminalFormatter(), {
  help: `Usage: <search query>`,

  setup: async () => {
    const vectorStorage = createStorage("vectors");
    contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
    descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");

    const resourceStorage = createStorage("resources");
    const policyStorage = createStorage("policies");
    const policy = new Policy(policyStorage);
    resourceIndex = new ResourceIndex(resourceStorage, policy);
  },

  state: {
    limit: 0,
    threshold: 0,
    index: "content",
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
    index: (args, state) => {
      if (args.length === 0) {
        return "Usage: /index content|descriptor";
      }
      const value = args[0].toLowerCase();
      if (value !== "content" && value !== "descriptor") {
        return `Error: index must be 'content' or 'descriptor'`;
      }
      state.index = value;
    },
  },

  onLine: performSearch,
});

repl.start();
