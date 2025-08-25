/* eslint-env node */

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
  #knowledgeStorage;
  #logger;

  /**
   * Creates a new ResourceProcessor instance
   * @param {ResourceIndexInterface} resourceIndex - ResourceIndex instance to add MessageV2 objects to
   * @param {StorageInterface} knowledgeStorage - Storage interface for knowledge base operations
   * @param {object} logger - Logger instance for debug output
   */
  constructor(resourceIndex, knowledgeStorage, logger) {
    super();
    if (!logger) throw new Error("logger is required");
    this.#resourceIndex = resourceIndex;
    this.#knowledgeStorage = knowledgeStorage;
    this.#logger = logger;
  }

  /**
   * Processes all HTML files in the specified directory
   * @param {string} extension - File extension to search for (default: ".html")
   * @param {string[]} selectors - Array of CSS selectors to filter microdata items (default: [])
   * @returns {Promise<void>}
   * @throws {Error} When file processing fails
   */
  async process(extension = ".html", selectors = []) {
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

    // Generate URN metadata - withMeta() will handle all metadata generation
    message.withMeta();

    return message;
  }
}
