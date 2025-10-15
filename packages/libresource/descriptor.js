/* eslint-env node */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import mustache from "mustache";

/**
 * Helper class for creating descriptors using LLM
 */
export class DescriptorProcessor {
  #llm;
  #descriptorTemplate;

  /**
   * Creates a new DescriptorProcessor instance
   * @param {import("@copilot-ld/libcopilot").Copilot} llm - LLM client for descriptor generation
   */
  constructor(llm) {
    if (!llm) throw new Error("llm is required");
    this.#llm = llm;

    // Load descriptor prompt template
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(
      __dirname,
      "../../scripts/descriptor-prompt.md.mustache",
    );
    this.#descriptorTemplate = readFileSync(templatePath, "utf8");
  }

  /**
   * Create a descriptor for the item using LLM
   * @param {object} item - The item object containing json data and metadata
   * @returns {Promise<object>} Descriptor object
   */
  async process(item) {
    const { json } = item;

    // Generate prompt using mustache template
    const prompt = mustache.render(this.#descriptorTemplate, { json });

    // Call LLM to generate descriptor
    const completion = await this.#llm.createCompletions(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      undefined, // tools
      0.1, // temperature
      2000, // max_tokens
    );

    let descriptor = {};
    try {
      descriptor = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      throw new Error(`LLM response parsing failed: ${error.message}`);
    }

    if (
      !descriptor?.purpose ||
      !descriptor.applicability ||
      !descriptor.evaluation
    ) {
      throw new Error(
        `Descriptor format is invalid: ${JSON.stringify(descriptor)}`,
      );
    }

    return descriptor;
  }
}
