/* eslint-env node */

import yaml from "js-yaml";
import { microdata } from "microdata-minimal";
import mustache from "mustache";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { LlmInterface } from "@copilot-ld/libcopilot";
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
  #llm;
  #descriptorTemplate;

  /**
   * Creates a new ResourceProcessor instance
   * @param {ResourceIndexInterface} resourceIndex - ResourceIndex instance
   * @param {StorageInterface} configStorage - Storage for configuration files
   * @param {StorageInterface} knowledgeStorage - Storage for knowledge base data
   * @param {LlmInterface} llm - LLM client for descriptor generation
   * @param {object} logger - Logger instance for debug output
   */
  constructor(resourceIndex, configStorage, knowledgeStorage, llm, logger) {
    super();
    if (!logger) throw new Error("logger is required");
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
      object.id = { name };
      object.descriptor = object.descriptor || {};
      const assistant = new common.Assistant(object);
      this.#resourceIndex.put(assistant);
    }
  }

  /** @inheritdoc */
  async processKnowledge(extension = ".html", selectors = []) {
    const keys = await this.#knowledgeStorage.findByExtension(extension);

    for (const key of keys) {
      const html = await this.#knowledgeStorage.get(key);
      const items = await this.#parseHTML(html, selectors);

      this.#logger.debug("Starting batch processing", {
        total: items.length,
        key,
      });

      // Process items in batches
      let currentBatch = [];
      let processedCount = 0;

      for (let i = 0; i < items.length; i++) {
        currentBatch.push({
          item: items[i],
          index: i,
        });

        // Process batch when it reaches a reasonable size
        if (currentBatch.length >= 5) {
          await this.#processBatch(
            currentBatch,
            processedCount,
            items.length,
            key,
          );
          processedCount += currentBatch.length;
          currentBatch = [];
        }
      }

      // Process any remaining items in the final batch
      if (currentBatch.length > 0) {
        await this.#processBatch(
          currentBatch,
          processedCount,
          items.length,
          key,
        );
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
   * Processes a batch of microdata items by generating descriptors and creating resources
   * @param {Array<{item: object, index: number}>} batch - Array of microdata items to process
   * @param {number} processed - Number of items already processed
   * @param {number} total - Total number of items to process
   * @param {string} key - Storage key for logging context
   * @returns {Promise<void>}
   */
  async #processBatch(batch, processed, total, key) {
    const batchSize = batch.length;

    this.#logger.debug("Processing batch", {
      items:
        batchSize > 1
          ? `${processed + 1}-${processed + batchSize}/${total}`
          : `${processed + 1}/${total}`,
      key,
    });

    // Create batch content for template
    const batchContent = batch
      .map((data, i) => {
        const jsonld = JSON.stringify(data.item);
        return `RESOURCE ${i + 1}:\n${jsonld}`;
      })
      .join("\n\n");

    // Generate prompt using mustache template
    const prompt = mustache.render(this.#descriptorTemplate, { batchContent });

    const completion = await this.#llm.createCompletions({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000, // Increased for batch processing
      temperature: 0.1,
    });

    let descriptors = [];
    try {
      descriptors = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      this.#logger.debug("LLM batch response is not valid JSON", {
        error: error.message,
        response: completion.choices[0].message.content,
      });
      throw new Error(`LLM batch response parsing failed: ${error.message}`);
    }

    // Validate we got the expected number of descriptors
    if (!Array.isArray(descriptors) || descriptors.length !== batchSize) {
      throw new Error(
        `Expected ${batchSize} descriptors, got ${descriptors.length}`,
      );
    }

    // Create and store resources for each item in the batch
    const promises = batch.map(async (data, i) => {
      try {
        const resource = this.#createResourceFromData(
          data.item,
          descriptors[i],
        );
        await this.#resourceIndex.put(resource);
      } catch (error) {
        this.#logger.debug("Skipping, failed to create resource", {
          item: `${processed + i + 1}/${total}`,
          key,
          error: error.message,
        });
      }
    });

    await Promise.all(promises);
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
