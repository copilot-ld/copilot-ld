/* eslint-env node */
import readline from "readline";
import { Store } from "n3";

import { TripleIndex, parseTripleQuery } from "@copilot-ld/libtriple";
import { Repl } from "@copilot-ld/librepl";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { storageFactory } from "@copilot-ld/libstorage";

// Global state
/** @type {TripleIndex} */
let tripleIndex;

/**
 * Performs a triple query using the parsed pattern
 * @param {string} prompt - The triple query string (e.g., "person:john ? ?")
 * @param {object} state - REPL state containing limit setting
 * @returns {Promise<string>} Formatted query results as markdown
 */
async function performQuery(prompt, state) {
  const { limit } = state;

  try {
    // Parse the triple query line
    const pattern = parseTripleQuery(prompt);

    // Execute the query
    const identifiers = await tripleIndex.queryItems(pattern);

    // Apply limit if specified
    const limitedResults =
      limit() > 0 ? identifiers.slice(0, limit()) : identifiers;

    // Format output identical to search script
    let output = ``;

    if (limitedResults.length === 0) {
      output += `No matching triples found.\n`;
    } else {
      limitedResults.forEach((identifier, i) => {
        output += `# ${i + 1}\n\n`;
        output += `${identifier}\n\n`;
      });
    }

    return output;
  } catch (error) {
    return (
      `Error: ${error.message}\n\nExample queries:\n` +
      `  person:john ? ?           # Find all triples about person:john\n` +
      `  ? foaf:name "John Doe"    # Find all people with name "John Doe"\n` +
      `  ? ? ?                     # Find all triples (use limit to avoid overwhelming output)\n`
    );
  }
}

// Create REPL with dependency injection
const repl = new Repl(readline, process, createTerminalFormatter(), {
  setup: async () => {
    const triplesStorage = storageFactory("triples");
    const store = new Store();
    tripleIndex = new TripleIndex(triplesStorage, store, "triples.jsonl");
  },
  state: {
    limit: {
      initial: 10,
      description: "Maximum number of results to display (0 for no limit)",
    },
  },
  commands: {
    help: {
      help: "Show query syntax help",
      handler: () => {
        return `Triple Query Syntax:

Format: <subject> <predicate> <object>

Rules:
- Use ? as wildcard for any field
- Quote strings with spaces: "John Doe"
- Examples:
  person:john ? ?           # Find all about person:john
  ? foaf:name "John Doe"    # Find entities named "John Doe"
  ? rdf:type Person         # Find all Person instances
  ? ? ?                     # Find all triples

State Commands:
- /limit <number>           # Set result limit (0 = no limit)

Other Commands:
- /help                     # Show this help
- exit                      # Exit the program`;
      },
    },
  },
  onLine: performQuery,
});

repl.start();
