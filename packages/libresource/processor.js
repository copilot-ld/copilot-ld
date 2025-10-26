/* eslint-env node */

import { JSDOM } from "jsdom";
import { minify } from "html-minifier-terser";
import { sanitizeDom } from "./sanitizer.js";
import jsonld from "jsonld";
import { MicrodataRdfParser } from "microdata-rdf-streaming-parser";
import { Writer } from "n3";

import { common } from "@copilot-ld/libtype";
import { ProcessorBase, countTokens, generateHash } from "@copilot-ld/libutil";

/** Resource processor for batch processing HTML files into Message objects */
export class ResourceProcessor extends ProcessorBase {
  #resourceIndex;
  #knowledgeStorage;
  #describer;
  #logger;
  #baseIri;
  #skolemizer;

  /**
   * Creates a new ResourceProcessor instance
   * @param {string} baseIri - Base IRI for resource identification
   * @param {object} resourceIndex - Index for storing resources
   * @param {object} knowledgeStorage - Storage backend for knowledge files
   * @param {object} skolemizer - Blank node skolemizer
   * @param {object} describer - Optional resource describer
   * @param {object} logger - Logger instance
   */
  constructor(
    baseIri,
    resourceIndex,
    knowledgeStorage,
    skolemizer,
    describer,
    logger,
  ) {
    super(logger, 5);
    if (!skolemizer) throw new Error("skolemizer is required");
    this.#baseIri = baseIri;
    this.#resourceIndex = resourceIndex;
    this.#knowledgeStorage = knowledgeStorage;
    this.#skolemizer = skolemizer;
    this.#describer = describer || null;
    this.#logger = logger || { debug: () => {} };
  }

  /**
   * Processes HTML files from knowledge storage
   * @param {string} extension - File extension to filter by
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
   * Extracts base IRI from DOM or uses fallback
   * @param {object} dom - JSDOM instance
   * @param {string} key - Storage key
   * @returns {string} Base IRI for the document
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
   * Minifies HTML content
   * @param {string} html - HTML content to minify
   * @returns {Promise<string>} Minified HTML
   */
  async #minifyHTML(html) {
    return await minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    });
  }

  /**
   * Extracts RDF quads from HTML using microdata parser
   * @param {string} html - HTML content
   * @param {string} baseIri - Base IRI for parsing
   * @returns {Promise<Array>} Array of RDF quads
   */
  async #extractQuads(html, baseIri) {
    return new Promise((resolve, reject) => {
      const quads = [];
      const parser = new MicrodataRdfParser({
        baseIRI: baseIri,
        contentType: "text/html",
      });

      parser.on("data", (quad) => {
        quads.push(quad);
      });

      parser.on("error", (error) => {
        reject(new Error(`Microdata parsing failed: ${error.message}`));
      });

      parser.on("end", () => {
        const skolemizedQuads = this.#skolemizer.skolemize(quads);
        resolve(skolemizedQuads);
      });

      parser.write(html);
      parser.end();
    });
  }

  /**
   * Converts RDF quads to Turtle format string
   * @param {Array} quads - Array of RDF quads
   * @returns {Promise<string>} RDF in Turtle format
   */
  async #quadsToRdf(quads) {
    const typeUri = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    const sortedQuads = quads.slice().sort((a, b) => {
      const aIsType = a.predicate.value === typeUri;
      const bIsType = b.predicate.value === typeUri;
      return aIsType === bIsType ? 0 : aIsType ? -1 : 1;
    });

    return new Promise((resolve, reject) => {
      const writer = new Writer({ format: "N-Quads" });
      writer.addQuads(sortedQuads);
      writer.end((error, result) => {
        if (error)
          reject(new Error(`N-Quads serialization failed: ${error.message}`));
        else resolve(result);
      });
    });
  }

  /**
   * Groups RDF quads by their schema.org typed items
   * @param {Array} allQuads - Complete set of RDF quads from HTML
   * @returns {Map} Map of item IRIs to their related quads
   */
  #groupQuadsByItem(allQuads) {
    const typedItems = new Set(
      allQuads
        .filter(
          (q) =>
            q.predicate.value ===
              "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
            q.object.value.startsWith("https://schema.org/"),
        )
        .map((q) => q.subject.value),
    );

    const itemGroups = new Map();
    for (const itemIri of typedItems) {
      const visited = new Set();
      const toProcess = [itemIri];
      const relevantQuads = [];

      while (toProcess.length > 0) {
        const current = toProcess.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        for (const quad of allQuads) {
          if (quad.subject.value === current) {
            relevantQuads.push(quad);
            if (
              quad.object.termType === "NamedNode" &&
              !visited.has(quad.object.value)
            ) {
              toProcess.push(quad.object.value);
            }
          }
        }
      }

      if (relevantQuads.length > 0) {
        itemGroups.set(itemIri, relevantQuads);
      }
    }
    return itemGroups;
  }

  /**
   * Converts RDF to JSON-LD format
   * @param {string} rdf - RDF in N-Quads format
   * @returns {Promise<Array>} Array of JSON-LD objects
   */
  async #rdfToJson(rdf) {
    const jsonldArray = await jsonld.fromRDF(rdf, {
      format: "application/n-quads",
    });
    const context = {
      "@vocab": "https://schema.org/",
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    };
    return Promise.all(
      jsonldArray.map((item) => jsonld.compact(item, context)),
    );
  }

  /**
   * Parses HTML and extracts structured items
   * @param {object} dom - JSDOM instance
   * @param {string} baseIri - Base IRI for parsing
   * @returns {Promise<Array>} Array of extracted items
   */
  async #parseHTML(dom, baseIri) {
    const minifiedHtml = await this.#minifyHTML(dom.serialize());
    const allQuads = await this.#extractQuads(minifiedHtml, baseIri);

    if (!allQuads || allQuads.length === 0) {
      this.#logger.debug("No RDF data found in HTML content");
      return [];
    }

    const itemGroups = this.#groupQuadsByItem(allQuads);
    const items = [];

    for (const [itemIri, itemQuads] of itemGroups) {
      const itemName = generateHash(itemIri);
      if (await this.#resourceIndex.has(`common.Message:${itemName}`)) continue;

      const itemRdf = await this.#quadsToRdf(itemQuads);
      const itemJsonArray = await this.#rdfToJson(itemRdf);
      const mainItem =
        itemJsonArray.find((item) => item["@id"] === itemIri) ||
        itemJsonArray[0];

      if (mainItem) {
        items.push({
          name: itemName,
          subject: itemIri,
          rdf: itemRdf,
          json: JSON.stringify(mainItem),
        });
      }
    }
    return items;
  }

  /**
   * Processes an extracted item into a Message resource
   * @param {object} item - Item to process
   * @returns {Promise<object>} Processed Message resource
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
   * Creates message content from item data
   * @param {object} item - Item with RDF and JSON data
   * @returns {Promise<object>} Content object for Message
   */
  async #createContent(item) {
    return {
      nquads: item.rdf,
      jsonld: item.json,
      tokens: countTokens(item.json),
    };
  }
}
