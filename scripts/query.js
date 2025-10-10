/* eslint-env node */
import { Store } from "n3";

import { GraphIndex, parseGraphQuery } from "@copilot-ld/libgraph";
import { Repl } from "@copilot-ld/librepl";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { createStorage } from "@copilot-ld/libstorage";

// Global state
/** @type {GraphIndex} */
let graphIndex;
/** @type {ResourceIndex} */
let resourceIndex;

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
    const resources = await resourceIndex.get(
      "common.System.root",
      identifiers,
    );

    let output = ``;

    if (identifiers.length === 0) {
      output += `No matching graphs found.\n`;
    } else {
      identifiers.forEach((identifier, i) => {
        const resource = resources.find((r) => r.id.name === identifier.name);
        if (!resource) return;

        // Not all resources have content, fallback to descriptor
        const text = resource.content
          ? String(resource.content)
          : String(resource.descriptor);

        output += `# ${i + 1}\n\n`;
        output += `${identifier}\n`;
        output += `\n\n\`\`\`json\n${text.substring(0, 500)}\n\`\`\`\n\n`;
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
    const graphsStorage = createStorage("graphs");
    const store = new Store();
    graphIndex = new GraphIndex(graphsStorage, store, "graphs.jsonl");

    const resourceStorage = createStorage("resources");
    const policyStorage = createStorage("policies");
    const policy = new Policy(policyStorage);
    resourceIndex = new ResourceIndex(resourceStorage, policy);
  },

  onLine: performQuery,
});

repl.start();
