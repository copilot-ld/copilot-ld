/* eslint-env node */

import { JSDOM } from "jsdom";
import { sanitizeDom } from "./sanitizer.js";

import { common } from "@copilot-ld/libtype";
import { ProcessorBase, countTokens, generateHash } from "@copilot-ld/libutil";

/**
 * Batch processes HTML knowledge files into structured Message resources.
 * Implements RDF union semantics to merge entity references across files.
 * See docs/reference.md for detailed processing pipeline and architecture.
 */
export class ResourceProcessor extends ProcessorBase {
  #resourceIndex;
  #knowledgeStorage;
  #parser;
  #describer;
  #logger;
  #baseIri;

  /**
   * Creates a new ResourceProcessor instance
   * @param {string} baseIri - Base IRI for resource identification (fallback if HTML lacks <base>)
   * @param {object} resourceIndex - Index for storing/retrieving Message resources
   * @param {object} knowledgeStorage - Storage backend for HTML knowledge files
   * @param {object} parser - Parser instance for HTML→RDF→JSON-LD conversions
   * @param {object} describer - Optional descriptor generator for semantic metadata
   * @param {object} logger - Logger instance with debug() method
   * @throws {Error} If parser is null or undefined
   */
  constructor(
    baseIri,
    resourceIndex,
    knowledgeStorage,
    parser,
    describer,
    logger,
  ) {
    super(logger, 5);

    if (!parser) throw new Error("parser is required");

    this.#baseIri = baseIri;
    this.#parser = parser;
    this.#resourceIndex = resourceIndex;
    this.#knowledgeStorage = knowledgeStorage;
    this.#describer = describer || null;
    this.#logger = logger || { debug: () => {} };
  }

  /**
   * Processes HTML files from knowledge storage into Message resources
   * @param {string} extension - File extension to filter by (default: ".html")
   * @returns {Promise<void>}
   */
  async process(extension = ".html") {
    const keys = await this.#knowledgeStorage.findByExtension(extension);

    for (const key of keys) {
      const htmlContent = await this.#knowledgeStorage.get(key);
      const html = Buffer.isBuffer(htmlContent)
        ? htmlContent.toString("utf8")
        : String(htmlContent);

      const dom = new JSDOM(html);
      sanitizeDom(dom);

      const baseIri = this.#extractBaseIri(dom, key);
      const items = await this.#parseHTML(dom, baseIri);

      await super.process(items, key);
    }
  }

  /**
   * Extracts base IRI from DOM's base element or uses fallback
   * @param {object} dom - JSDOM instance with parsed HTML
   * @param {string} key - Storage key (filename) for fallback IRI generation
   * @returns {string} Base IRI to use for this document
   */
  #extractBaseIri(dom, key) {
    const baseElement = dom.window.document.querySelector("base[href]");
    return (
      baseElement?.getAttribute("href") ||
      this.#baseIri ||
      `https://example.invalid/${key}`
    );
  }

  /**
   * Parses HTML DOM and extracts structured items with RDF union merging.
   * Implements entity merging across files using stable IRI-based identifiers.
   * @param {object} dom - JSDOM instance with parsed and sanitized HTML
   * @param {string} baseIri - Base IRI for resolving relative references
   * @returns {Promise<Array>} Array of item objects ready for processItem()
   */
  async #parseHTML(dom, baseIri) {
    const parsedItems = await this.#parser.parseHTML(dom, baseIri);

    if (!parsedItems || parsedItems.length === 0) {
      return [];
    }

    const items = [];

    for (const parsedItem of parsedItems) {
      const itemName = generateHash(parsedItem.iri);
      const resourceKey = `common.Message.${itemName}`;

      if (await this.#resourceIndex.has(resourceKey)) {
        const [existing] = await this.#resourceIndex.get([resourceKey]);
        const existingQuads = await this.#parser.rdfToQuads(
          existing.content.nquads,
        );

        const mergedQuads = this.#parser.unionQuads(
          existingQuads,
          parsedItem.quads,
        );

        if (mergedQuads.length > existingQuads.length) {
          this.#logger.debug(
            `Merging resource ${itemName}: ${existingQuads.length} -> ${mergedQuads.length} quads`,
          );

          const mergedRdf = await this.#parser.quadsToRdf(mergedQuads);
          const mergedJsonArray = await this.#parser.rdfToJson(mergedRdf);
          const mergedItem =
            mergedJsonArray.find((item) => item["@id"] === parsedItem.iri) ||
            mergedJsonArray[0];

          if (mergedItem) {
            items.push({
              name: itemName,
              subject: parsedItem.iri,
              rdf: mergedRdf,
              json: JSON.stringify(mergedItem),
            });
          }
        } else {
          this.#logger.debug(
            `Skipping duplicate resource ${itemName}: no new information`,
          );
        }

        continue;
      }

      items.push({
        name: itemName,
        subject: parsedItem.iri,
        rdf: parsedItem.rdf,
        json: parsedItem.json,
      });
    }

    return items;
  }

  /**
   * Processes an extracted item into a complete Message resource
   * @param {object} item - Item object with name, subject, rdf, and json properties
   * @returns {Promise<object>} Typed Message resource stored in ResourceIndex
   */
  async processItem(item) {
    const { name, subject } = item;

    const descriptor = this.#describer
      ? await this.#describer.describe(item)
      : undefined;

    const content = await this.#createContent(item);

    const message = { id: { name, subject }, role: "system", content };
    if (descriptor) message.descriptor = descriptor;

    const resource = common.Message.fromObject(message);
    await this.#resourceIndex.put(resource);

    return resource;
  }

  /**
   * Creates message content object from item's RDF data
   * @param {object} item - Item with rdf (N-Quads) and json (JSON-LD string) properties
   * @returns {Promise<object>} Content object with nquads, jsonld, and tokens
   */
  async #createContent(item) {
    return {
      nquads: item.rdf,
      jsonld: item.json,
      tokens: countTokens(item.json),
    };
  }
}
