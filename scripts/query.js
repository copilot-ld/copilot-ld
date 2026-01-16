#!/usr/bin/env node
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
 * @param {import("stream").Writable} outputStream - Stream to write results to
 */
async function performQuery(prompt, state, outputStream) {
  try {
    // Parse and execute the query
    const pattern = parseGraphQuery(prompt);
    const identifiers = await state.graphIndex.queryItems(pattern);

    if (identifiers.length === 0) {
      outputStream.write("No results\n");
      return;
    }

    identifiers.forEach((identifier, i) => {
      // Get the graph item directly from the GraphIndex internal index
      const item = state.graphIndex.index.get(String(identifier));

      if (!item || !item.quads) {
        outputStream.write(
          `# ${i + 1}\n\n${identifier}\n\nNo graph data available.\n\n`,
        );
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

      let output = `# ${i + 1}: ${identifier}\n\n`;
      output += `\n\`\`\`turtle\n${quadsText}\n\`\`\`\n\n`;
      outputStream.write(output);
    });
  } catch (error) {
    const errorMsg =
      `Error: ${error.message}\n\nExample queries:\n` +
      `  person:john ? ?           # Find all graphs about person:john\n` +
      `  ? foaf:name "John Doe"    # Find all people with name "John Doe"\n` +
      `  ? ? ?                     # Find all graphs\n`;
    outputStream.write(errorMsg);
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
