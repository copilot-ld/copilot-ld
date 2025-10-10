/* eslint-env node */
import { Store } from "n3";

import { TripleIndex, parseTripleQuery } from "@copilot-ld/libtriple";
import { Repl } from "@copilot-ld/librepl";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { createStorage } from "@copilot-ld/libstorage";

// Global state
/** @type {TripleIndex} */
let tripleIndex;
/** @type {ResourceIndex} */
let resourceIndex;

/**
 * Performs a triple query using the parsed pattern
 * @param {string} prompt - The triple query string (e.g., "person:john ? ?")
 * @returns {Promise<string>} Formatted query results as markdown
 */
async function performQuery(prompt) {
  try {
    // Parse and execute the query
    const pattern = parseTripleQuery(prompt);
    const identifiers = await tripleIndex.queryItems(pattern);
    const resources = await resourceIndex.get(
      "common.System.root",
      identifiers,
    );

    let output = ``;

    if (identifiers.length === 0) {
      output += `No matching triples found.\n`;
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
      `  person:john ? ?           # Find all triples about person:john\n` +
      `  ? foaf:name "John Doe"    # Find all people with name "John Doe"\n` +
      `  ? ? ?                     # Find all triples\n`
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
? ? ?                   # Find all triples`,

  setup: async () => {
    const triplesStorage = createStorage("triples");
    const store = new Store();
    tripleIndex = new TripleIndex(triplesStorage, store, "triples.jsonl");

    const resourceStorage = createStorage("resources");
    const policyStorage = createStorage("policies");
    const policy = new Policy(policyStorage);
    resourceIndex = new ResourceIndex(resourceStorage, policy);
  },

  onLine: performQuery,
});

repl.start();
