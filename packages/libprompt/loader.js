import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import mustache from "mustache";

/**
 * Prompt loader with optional Mustache templating.
 * Follows constructor dependency injection pattern.
 * No caching - prompts are typically loaded once at construction.
 */
export class PromptLoader {
  #promptDir;

  /**
   * Create a new PromptLoader instance
   * @param {string} promptDir - Directory containing .prompt.md files
   */
  constructor(promptDir) {
    if (!promptDir) throw new Error("promptDir is required");
    this.#promptDir = promptDir;
  }

  /**
   * Load a prompt file
   * @param {string} promptName - Name of the prompt file (without .prompt.md)
   * @returns {string} Raw prompt content
   */
  load(promptName) {
    if (!promptName) throw new Error("promptName is required");

    const promptPath = join(this.#promptDir, `${promptName}.prompt.md`);
    if (!existsSync(promptPath)) {
      throw new Error(`Prompt file not found: ${promptPath}`);
    }

    return readFileSync(promptPath, { encoding: "utf-8" });
  }

  /**
   * Load and render a prompt with Mustache templating
   * @param {string} promptName - Name of the prompt file (without .prompt.md)
   * @param {object} data - Data to render into the template
   * @returns {string} Rendered prompt content
   */
  render(promptName, data = {}) {
    const template = this.load(promptName);
    return mustache.render(template, data);
  }
}
