#!/usr/bin/env node
/* eslint-env node */
import { Store, Writer } from "n3";

import {
  createGraphIndex,
  parseGraphQuery,
  RDF_PREFIXES,
} from "@copilot-ld/libgraph";
import { Repl } from "@copilot-ld/librepl";

const usage = `**Usage:** <subject> <predicate> <object>

Query the graph database using RDF triple patterns with wildcard support.
Use ? as wildcard for any field. Quote strings containing spaces.

**Examples:**

    echo "person:john ? ?" | npm -s run cli:query
    echo "? foaf:name ?" | npm -s run cli:query
    echo '? ? "John Doe"' | npm -s run cli:query
    echo "? rdf:type schema:Person" | npm -s run cli:query
    echo "? ? ?" | npm -s run cli:query`;

/**
 * Performs a graph query using the parsed pattern
 * @param {string} prompt - The graph query string (e.g., "person:john ? ?")
 * @param {object} state - The REPL state object
 * @returns {Promise<string>} Formatted query results as markdown
 */
async function performQuery(prompt, state) {
  try {
    // Parse and execute the query
    const pattern = parseGraphQuery(prompt);
    const identifiers = await state.graphIndex.queryItems(pattern);

    let output = ``;

    if (identifiers.length === 0) {
      output += `No results\n`;
    } else {
      identifiers.forEach((identifier, i) => {
        // Get the graph item directly from the GraphIndex internal index
        const item = state.graphIndex.index.get(String(identifier));

        if (!item || !item.quads) {
          output += `# ${i + 1}\n\n`;
          output += `${identifier}\n`;
          output += `\n\nNo graph data available.\n\n`;
          return;
        }

        // Convert quads to a readable format using N3 Writer
        const tempStore = new Store();
        item.quads.forEach((quad) => tempStore.addQuad(quad));

        const writer = new Writer({
          format: "turtle",
          prefixes: RDF_PREFIXES,
        });

        const quadsText = writer.quadsToString(tempStore.getQuads());

        output += `# ${i + 1}: ${identifier}\n\n`;
        output += `\n\`\`\`turtle\n${quadsText}\n\`\`\`\n\n`;
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
const repl = new Repl({
  usage,

  setup: async (state) => {
    state.graphIndex = createGraphIndex("graphs");
  },

  onLine: performQuery,
});

repl.start();
