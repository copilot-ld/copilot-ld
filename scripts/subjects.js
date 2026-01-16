#!/usr/bin/env node
import { createGraphIndex } from "@copilot-ld/libgraph";
import { Repl } from "@copilot-ld/librepl";

const usage = `**Usage:** <RDF type>

Retrieve all subjects and their types from the graph index.
Provide empty input (or "*") to get all subjects, or specify a type URI to filter.

**Examples:**

    echo "" | npm -s run cli:subjects
    echo "*" | npm -s run cli:subjects
    echo "https://schema.org/Person" | npm -s run cli:subjects
    echo "https://schema.org/ScholarlyArticle" | npm -s run cli:subjects`;

/**
 * Retrieves subjects and their types from the graph index
 * @param {string} prompt - The type filter (use "*" or empty for all subjects)
 * @param {object} state - The REPL state object
 * @param {import("stream").Writable} outputStream - Stream to write results to
 */
async function getSubjects(prompt, state, outputStream) {
  try {
    const trimmed = prompt.trim();
    // Pass the input directly to getSubjects - it handles wildcard normalization
    const subjects = await state.graphIndex.getSubjects(trimmed);

    if (subjects.size === 0) {
      outputStream.write("No subjects found\n");
      return;
    }

    const lines = Array.from(subjects.entries())
      .map(([subject, type]) => `${subject}\t${type}`)
      .sort();

    outputStream.write(lines.join("\n") + "\n");
  } catch (error) {
    outputStream.write(`Error: ${error.message}\n`);
  }
}

// Create REPL with dependency injection
const repl = new Repl({
  usage,

  setup: async (state) => {
    state.graphIndex = createGraphIndex("graphs");
  },

  onLine: getSubjects,
});

repl.start();
