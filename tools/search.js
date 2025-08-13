/* eslint-env node */
import readline from "readline";

import { ChunkIndex } from "@copilot-ld/libchunk";
import { Copilot } from "@copilot-ld/libcopilot";
import { ToolConfig } from "@copilot-ld/libconfig";
import { Repl } from "@copilot-ld/librepl";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { resolveScope } from "@copilot-ld/libscope";
import {
  VectorIndex,
  initializeVectorIndices,
  queryIndices,
} from "@copilot-ld/libvector";

// Configuration
const config = new ToolConfig("search");
const VECTORS_DIR = config.storagePath("vectors");
const SCOPE_DIR = config.storagePath("scope");
const CHUNKS_DIR = config.storagePath("chunks");

// Global state
/** @type {Map<string, VectorIndex>} */
let vectorIndices;
/** @type {VectorIndex} */
let scopeIndex;
/** @type {ChunkIndex} */
let chunkIndex;

/**
 * Performs a semantic search using embeddings and scope resolution
 * @param {string} prompt - The search query text
 * @param {object} state - REPL state containing limit and threshold settings
 * @returns {Promise<string>} Formatted search results as markdown
 */
async function performSearch(prompt, state) {
  const { limit, threshold } = state;

  const client = new Copilot(config.githubToken());
  const embeddings = await client.createEmbeddings([prompt]);
  const resolvedScopes = await resolveScope(
    embeddings[0].embedding,
    scopeIndex,
  );

  const scopedIndices = resolvedScopes
    .map((scope) => vectorIndices.get(scope))
    .filter((index) => index);

  const results = await queryIndices(
    scopedIndices,
    embeddings[0].embedding,
    threshold(),
    limit() > 0 ? limit() : 0,
  );

  const chunkIds = results.map((result) => result.id);
  const chunkObjects = await chunkIndex.getChunks(chunkIds);

  let content = ``;
  results.forEach((result, i) => {
    const chunkData = chunkObjects[result.id];
    const text = chunkData.text;
    content += `# ${i + 1} Score: ${result.score.toFixed(4)}\n\n`;
    content += `- Scope: ${result.scope}\n`;
    content += `- ID: ${result.id}\n`;
    content += `\n\n\`\`\`json\n${text.substring(0, 200)}\n\`\`\`\n\n`;
  });

  return content;
}

// Create REPL with dependency injection
const repl = new Repl(readline, process, createTerminalFormatter(), {
  setup: async () => {
    vectorIndices = await initializeVectorIndices(VECTORS_DIR);
    const scopeStorage = config.storage(SCOPE_DIR);
    scopeIndex = new VectorIndex(scopeStorage);
    const chunksStorage = config.storage(CHUNKS_DIR);
    chunkIndex = new ChunkIndex(chunksStorage);
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
