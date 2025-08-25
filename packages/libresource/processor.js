/* eslint-env node */

import yaml from "js-yaml";
import { microdata } from "microdata-minimal";
import prettier from "prettier";

import { StorageInterface } from "@copilot-ld/libstorage";
import { common } from "@copilot-ld/libtype";

import { ResourceProcessorInterface, ResourceIndexInterface } from "./types.js";

/**
 * Resource processor for batch processing HTML files into MessageV2 objects
 * @implements {ResourceProcessorInterface}
 */
export class ResourceProcessor extends ResourceProcessorInterface {
  #resourceIndex;
  #configStorage;
  #knowledgeStorage;
  #logger;

  /**
   * Creates a new ResourceProcessor instance
   * @param {ResourceIndexInterface} resourceIndex - ResourceIndex instance
   * @param {StorageInterface} configStorage - Storage for configuration files
   * @param {StorageInterface} knowledgeStorage - Storage for knowledge base data
   * @param {object} logger - Logger instance for debug output
   */
  constructor(resourceIndex, configStorage, knowledgeStorage, logger) {
    super();
    if (!logger) throw new Error("logger is required");
    this.#resourceIndex = resourceIndex;
    this.#configStorage = configStorage;
    this.#knowledgeStorage = knowledgeStorage;
    this.#logger = logger;
  }

  async processAssistants() {
    const data = await this.#configStorage.get("assistants.yml");
    const objects = yaml.load(data);

    for (const [name, object] of Object.entries(objects)) {
      object.meta.name = name;
      const assistant = new common.Assistant.fromObject(object);
      this.#resourceIndex.put(assistant);
    }
  }

  /** @inheritdoc */
  async processKnowledge(extension = ".html", selectors = []) {
    const keys = await this.#knowledgeStorage.findByExtension(extension);

    for (const key of keys) {
      const html = await this.#knowledgeStorage.get(key);
      const items = await this.#parseHTML(html, selectors);

      for (let i = 0; i < items.length; i++) {
        this.#logger.debug("Processing", {
          item: `${i + 1}/${items.length}`,
          key,
        });

        const message = await this.#createMessage(items[i]);

        await this.#resourceIndex.put(message);
      }
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

  /**
   * Creates a Message object from a microdata item
   * @param {object} item - The microdata item to create a Message for
   * @returns {Promise<common.Message>} The created Message instance
   */
  async #createMessage(item) {
    const raw = JSON.stringify(item);
    const formatted = await prettier.format(raw, { parser: "json" });
    const content = formatted.toString();

    const message = new common.MessageV2({
      role: "system",
      content,
    });

    return message;
  }
}
