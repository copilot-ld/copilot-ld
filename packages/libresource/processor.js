/* eslint-env node */

import yaml from "js-yaml";
import { microdata } from "microdata-minimal";

import { LlmInterface } from "@copilot-ld/libcopilot";
import { StorageInterface } from "@copilot-ld/libstorage";
import { common } from "@copilot-ld/libtype";

import { ResourceProcessorInterface, ResourceIndexInterface } from "./types.js";

/**
 * Template for generating resource descriptors via LLM completion
 */
const DESCRIPTOR_PROMPT = `You are analyzing structured content for an AI agent knowledge base.
Generate descriptors that help AI agents understand when and how to use this resource effectively.

**CRITICAL:**
- Your response must be RAW JSON starting with { and ending with }
- Do not use markdown code blocks, backticks, or any formatting

**YOUR RESPONSE:**
Reply with a JSON object containing these keys:

1. **purpose**
   - What this resource accomplishes for software development teams
   - Start with an action verb (e.g., "Provides", "Defines", "Establishes")
   - Focus on the tangible outcome or capability it delivers

2. **applicability**
   - When AI agents should reference this resource
   - Use "when" statements describing specific scenarios, contexts, or user questions where this content becomes relevant
   - Examples: "When discussing team collaboration principles", "When evaluating security vulnerabilities"

3. **evaluation**
   - How to measure successful application of this resource's guidance
   - Describe observable outcomes, behaviors, or criteria that indicate the resource was applied effectively
   - Examples: "Teams demonstrate faster decision-making", "Security assessment identifies specific vulnerability categories"

**CONTEXT:**
- You are helping conversational AI agents make better decisions about which knowledge to reference
- Agents need to quickly determine relevance to user queries
- Focus on practical application rather than academic description
- Consider both explicit questions and implicit needs in conversations

**FORMATTING REQUIREMENTS:**
- Start your response immediately with { (no backticks, no markdown)
- End your response with }
- Each value must be under 280 characters
- Use clear, specific language that guides decision-making
- NO explanations, NO code blocks, NO markdown formatting
- Focus on actionable guidance rather than content summary

**THE CONTENT TO ANALYZE:**
`;

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

      for (let i = 0; i < items.length; i++) {
        const item = `${i + 1}/${items.length}`;

        this.#logger.debug("Processing", { item, key });

        try {
          const resource = await this.#createResource(items[i]);
          await this.#resourceIndex.put(resource);
        } catch (error) {
          this.#logger.debug("Skipping, failed to create resource", {
            item,
            key,
            error: error.message,
          });
          continue;
        }
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
   * Creates a resource object from a microdata item
   * @param {object} item - The microdata item to create a Message for
   * @returns {Promise<common.MessageV2>} The created Message content
   */
  async #createResource(item) {
    // Create content
    const jsonld = JSON.stringify(item);

    // Create descriptor using LLM completion
    const prompt = `${DESCRIPTOR_PROMPT}${jsonld}`;

    const completion = await this.#llm.createCompletions({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    let descriptor = {};
    try {
      descriptor = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      this.#logger.debug("LLM response is not valid JSON", {
        error: error.message,
        response: completion.choices[0].message.content,
      });
      throw new Error(`LLM response parsing failed: ${error.message}`);
    }

    return common.MessageV2.fromObject({
      role: "system",
      content: { jsonld },
      descriptor,
    });
  }
}
