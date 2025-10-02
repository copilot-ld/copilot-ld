/* eslint-env node */

import yaml from "js-yaml";
import { microdata } from "microdata-minimal";
import mustache from "mustache";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { common } from "@copilot-ld/libtype";
import { ProcessorBase } from "@copilot-ld/libutil";

/**
 * Resource processor for batch processing HTML files into MessageV2 objects
 * @augments {ProcessorBase}
 */
export class ResourceProcessor extends ProcessorBase {
  #resourceIndex;
  #configStorage;
  #knowledgeStorage;
  #llm;
  #descriptorTemplate;
  #logger;

  /**
   * Creates a new ResourceProcessor instance
   * @param {object} resourceIndex - ResourceIndex instance
   * @param {object} configStorage - Storage for configuration files
   * @param {object} knowledgeStorage - Storage for knowledge base data
   * @param {object} llm - LLM client for descriptor generation
   * @param {object} logger - Logger instance for debug output
   */
  constructor(resourceIndex, configStorage, knowledgeStorage, llm, logger) {
    super(logger, 5);
    if (!llm) throw new Error("llm is required");
    this.#resourceIndex = resourceIndex;
    this.#configStorage = configStorage;
    this.#knowledgeStorage = knowledgeStorage;
    this.#llm = llm;
    this.#logger = logger;

    // Load descriptor prompt template
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(
      __dirname,
      "../../scripts/descriptor-prompt.md.mustache",
    );
    this.#descriptorTemplate = readFileSync(templatePath, "utf8");
  }

  async processAssistants() {
    const data = await this.#configStorage.get("assistants.yml");
    const objects = yaml.load(data);

    for (const [name, object] of Object.entries(objects)) {
      object.id = {
        type: "common.Assistant",
        name: `common.Assistant.${name}`,
      };
      object.descriptor = object.descriptor || {};
      const assistant = common.Assistant.fromObject(object);
      this.#resourceIndex.put(assistant);
    }
  }

  /**
   * Processes HTML files from a knowledge base
   * @param {string} extension - File extension to search for (default: ".html")
   * @param {string[]} selectors - Array of CSS selectors to filter microdata items (default: [])
   * @returns {Promise<void>}
   */
  async processKnowledge(extension = ".html", selectors = []) {
    const keys = await this.#knowledgeStorage.findByExtension(extension);

    for (const key of keys) {
      const html = await this.#knowledgeStorage.get(key);
      const items = await this.#parseHTML(html, selectors);

      // Convert items to the format expected by ProcessorBase
      const itemsWithIndexes = items.map((item, index) => ({
        item,
        index,
      }));

      // Use ProcessorBase to handle the batch processing
      await super.process(itemsWithIndexes, key);
    }
  }

  /**
   * Parse HTML content and extract microdata items.
   * @param {string} htmlContent - The HTML string to process
   * @param {string[]} selectors - Array of CSS selectors to filter microdata items
   * @returns {object[]} Array of microdata items
   */
  async #parseHTML(htmlContent, selectors) {
    try {
      return microdata(htmlContent, selectors);
    } catch (error) {
      this.#logger.debug("Microdata parsing failed, returning empty array", {
        error: error.message,
      });
      return [];
    }
  }

  /** @inheritdoc */
  async processItem(itemData) {
    const { item } = itemData;

    // Generate descriptor for this single item
    const jsonld = JSON.stringify(item);
    const batchContent = `RESOURCE 1:\n${jsonld}`;

    // Generate prompt using mustache template
    const prompt = mustache.render(this.#descriptorTemplate, { batchContent });

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

    let descriptors = [];
    try {
      descriptors = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      throw new Error(`LLM response parsing failed: ${error.message}`);
    }

    // Validate we got exactly one descriptor
    if (!Array.isArray(descriptors) || descriptors.length !== 1) {
      throw new Error(`Expected 1 descriptors, got ${descriptors.length}`);
    }

    // Create and store the resource
    const resource = this.#createResourceFromData(item, descriptors[0]);
    await this.#resourceIndex.put(resource);
    return resource;
  }

  /**
   * Creates a resource object from microdata item and pre-generated descriptor
   * @param {object} item - The microdata item
   * @param {object} descriptor - The pre-generated descriptor
   * @returns {common.MessageV2} The created Message resource
   */
  #createResourceFromData(item, descriptor) {
    const jsonld = JSON.stringify(item);
    return common.MessageV2.fromObject({
      role: "system",
      content: { jsonld },
      descriptor,
    });
  }
}
