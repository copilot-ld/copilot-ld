#!/usr/bin/env node
/* eslint-env node */
import { Store, Writer } from "n3";

import {
  createGraphIndex,
  parseGraphQuery,
  RDF_PREFIXES,
} from "@copilot-ld/libgraph";
import { Repl } from "@copilot-ld/librepl";
import { createTerminalFormatter } from "@copilot-ld/libformat";

// Global state
/** @type {import("@copilot-ld/libgraph").GraphIndex} */
let graphIndex;

/**
 * Performs a graph query using the parsed pattern
 * @param {string} prompt - The graph query string (e.g., "person:john ? ?")
 * @returns {Promise<string>} Formatted query results as markdown
 */
async function performQuery(prompt) {
  try {
    // Parse and execute the query
    const pattern = parseGraphQuery(prompt);
    const identifiers = await graphIndex.queryItems(pattern);

    let output = ``;

    if (identifiers.length === 0) {
      output += `No results\n`;
    } else {
      identifiers.forEach((identifier, i) => {
        // Get the graph item directly from the GraphIndex internal index
        const item = graphIndex.index.get(String(identifier));

        if (!item || !item.quads) {
          output += `# ${i + 1}\n\n`;
          output += `${identifier}\n`;
          output += `\n\nNo graph data available.\n\n`;
          return;
        }

        // Convert quads to a readable format using N3 Writer
        const tempStore = new Store();
        item.quads.slice(0, 10).forEach((quad) => tempStore.addQuad(quad));

        const writer = new Writer({
          format: "turtle",
          prefixes: RDF_PREFIXES,
        });

        const quadsText = writer.quadsToString(tempStore.getQuads());

        const hasMore = item.quads.length > 10;

        output += `# ${i + 1}: ${identifier}\n\n`;
        output += `\n\`\`\`turtle\n${quadsText}${hasMore ? "\n  # ... and " + (item.quads.length - 10) + " more triples" : ""}\n\`\`\`\n\n`;
      });
    }

    return output;
  } catch (error) {
    return (
      `Error: ${error.message}\n\nExample queries:\n` +
      `  person:john ? ?           # Find all graphs about person:john\n` +
      `  ? foaf:name "John Doe"    # Find all people with name "John Doe"\n` +
      `  ? ? ?                     # Find all graphs\n`
    );
  }
}

// Create REPL with dependency injection
const repl = new Repl(createTerminalFormatter(), {
  help: `Usage: <subject> <predicate> <object>

Use ? as wildcard for any field and quote strings with spaces.

Examples:

person:john ? ?         # Find all about person:john
? foaf:name "John Doe"  # Find entities named "John Doe"
? type Person           # Find all Person instances
? ? ?                   # Find all graphs`,

  setup: async () => {
    graphIndex = createGraphIndex("graphs");
  },

  onLine: performQuery,
});

repl.start();
