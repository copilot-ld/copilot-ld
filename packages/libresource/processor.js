/* eslint-env node */

import { JSDOM } from "jsdom";
import { minify } from "html-minifier-terser";
import jsonld from "jsonld";
import { MicrodataRdfParser } from "microdata-rdf-streaming-parser";
import { Writer } from "n3";

import { common } from "@copilot-ld/libtype";
import { ProcessorBase, countTokens } from "@copilot-ld/libutil";

/**
 * Resource processor for batch processing HTML files into Message objects
 * @augments {ProcessorBase}
 */
export class ResourceProcessor extends ProcessorBase {
  #resourceIndex;
  #knowledgeStorage;
  #descriptorProcessor;
  #logger;
  #baseIri;

  /**
   * Creates a new ResourceProcessor instance
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} knowledgeStorage - Storage for knowledge base data
   * @param {import("@copilot-ld/libresource").DescriptorProcessor} descriptorProcessor - DescriptorProcessor instance for descriptor generation
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance for debug output
   * @param {string} [baseIri] - Base IRI for resolving relative URLs
   */
  constructor(
    resourceIndex,
    knowledgeStorage,
    descriptorProcessor,
    logger,
    baseIri,
  ) {
    super(logger, 5);
    if (!descriptorProcessor)
      throw new Error("descriptorProcessor is required");
    this.#resourceIndex = resourceIndex;
    this.#knowledgeStorage = knowledgeStorage;
    this.#descriptorProcessor = descriptorProcessor;
    this.#logger = logger;
    this.#baseIri = baseIri;
  }

  /**
   * Processes HTML files from a knowledge base
   * @param {string} extension - File extension to search for (default: ".html")
   * @returns {Promise<void>}
   */
  async process(extension = ".html") {
    const keys = await this.#knowledgeStorage.findByExtension(extension);

    for (const key of keys) {
      const htmlContent = await this.#knowledgeStorage.get(key);
      // Convert to string immediately after retrieval from storage
      const html = Buffer.isBuffer(htmlContent)
        ? htmlContent.toString("utf8")
        : String(htmlContent);
      const items = await this.#parseHTML(html, key);
      await super.process(items, key);
    }
  }

  /**
   * Extract base IRI from HTML document
   * @param {string} html - The HTML string to process
   * @param {string} key - The document key/filename for fallback base IRI
   * @returns {string} The base IRI for the document
   * @private
   */
  #extractBaseIri(html, key) {
    try {
      const dom = new JSDOM(html);
      const baseElement = dom.window.document.querySelector("base[href]");
      if (baseElement) {
        return baseElement.getAttribute("href");
      }
    } catch {
      // Fall through to default
    }

    // Use provided base IRI or construct from document key
    return this.#baseIri || `https://example.invalid/${key}`;
  }

  /**
   * Minify HTML content to remove whitespace, comments, CSS, and JavaScript
   * @param {string} html - The HTML string to minify
   * @returns {Promise<string>} Minified HTML string
   * @private
   */
  async #minifyHTML(html) {
    return await minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      removeAttributeQuotes: false, // Keep quotes to preserve microdata
      removeOptionalTags: false, // Keep all tags for microdata parsing
      preserveLineBreaks: false,
    });
  }

  /**
   * Extract RDF quads from HTML content using microdata streaming parser
   * @param {string} html - The HTML string to process
   * @param {string} baseIri - Base IRI for resolving relative URLs
   * @returns {Promise<Array>} Array of quad objects
   * @private
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
        resolve(quads);
      });

      parser.write(html);
      parser.end();
    });
  }

  /**
   * Convert RDF/JS quads to N-Quads string
   * @param {Array} quads - Array of quad objects
   * @returns {Promise<string>} N-Quads string representation
   * @private
   */
  async #quadsToRdf(quads) {
    return new Promise((resolve, reject) => {
      try {
        const writer = new Writer({ format: "N-Quads" });
        writer.addQuads(quads);
        writer.end((error, result) => {
          if (error) {
            reject(new Error(`N-Quads serialization failed: ${error.message}`));
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(new Error(`N-Quads conversion failed: ${error.message}`));
      }
    });
  }

  /**
   * Group RDF quads by top-level items (Schema.org typed subjects)
   * @param {Array} allQuads - All RDF quads from the document
   * @returns {Map<string, Array>} Map of item IRI to quads for that item and its connected nodes
   * @private
   */
  #groupQuadsByItem(allQuads) {
    // Find all subjects that have Schema.org types (these are the items we want to process)
    const typedItems = new Set();

    for (const quad of allQuads) {
      if (
        quad.predicate.value ===
          "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
        quad.object.value.startsWith("https://schema.org/")
      ) {
        typedItems.add(quad.subject.value);
      }
    }

    const itemGroups = new Map();

    // For each typed item, collect all connected quads
    for (const itemIri of typedItems) {
      const relevantQuads = [];
      const visitedNodes = new Set();
      const nodesToProcess = [itemIri];

      // Breadth-first traversal to find all quads connected to the item
      while (nodesToProcess.length > 0) {
        const currentNode = nodesToProcess.shift();

        if (visitedNodes.has(currentNode)) {
          continue;
        }
        visitedNodes.add(currentNode);

        // Find all quads where this node is the subject
        for (const quad of allQuads) {
          const subjectValue = quad.subject.value;

          if (subjectValue === currentNode) {
            relevantQuads.push(quad);

            // If the object is a blank node or named node, add it for processing
            if (
              quad.object.termType === "BlankNode" ||
              (quad.object.termType === "NamedNode" &&
                !visitedNodes.has(quad.object.value))
            ) {
              nodesToProcess.push(quad.object.value);
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
   * Convert N-Quads to JSON-LD using jsonld library
   * @param {string} rdf - N-Quads string to convert
   * @returns {Promise<object[]>} Array of JSON-LD objects
   * @private
   */
  async #rdfToJson(rdf) {
    try {
      // Convert N-Quads to JSON-LD
      const jsonldArray = await jsonld.fromRDF(rdf, {
        format: "application/n-quads",
      });

      // Compact with Schema.org context
      const context = {
        "@vocab": "https://schema.org/",
        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      };

      const compacted = [];
      for (const item of jsonldArray) {
        const compactedItem = await jsonld.compact(item, context);
        compacted.push(compactedItem);
      }

      return compacted;
    } catch (error) {
      throw new Error(`JSON-LD conversion failed: ${error.message}`);
    }
  }

  /**
   * Parse HTML content and extract RDF data as JSON-LD objects.
   * @param {string} html - The HTML string to process
   * @param {string} key - Document key for base IRI derivation
   * @returns {Promise<object[]>} Array of JSON-LD objects with nquads and subject
   */
  async #parseHTML(html, key) {
    // Extract base IRI for the document
    const baseIri = this.#extractBaseIri(html, key);

    // Minify HTML to remove whitespace, comments, CSS, and JavaScript
    const minifiedHtml = await this.#minifyHTML(html);

    // Extract RDF from HTML (not N-Quads string)
    const allQuads = await this.#extractQuads(minifiedHtml, baseIri);

    if (!allQuads || allQuads.length === 0) {
      this.#logger.debug("No RDF data found in HTML content");
      return [];
    }

    // Group quads by top-level items to avoid blank node ID conflicts
    const itemGroups = this.#groupQuadsByItem(allQuads);

    // Process each item group directly to JSON-LD (single-pass)
    const items = [];
    for (const [itemIri, itemQuads] of itemGroups) {
      // Convert item quads to N-Quads
      const itemRdf = await this.#quadsToRdf(itemQuads);

      // Convert item N-Quads directly to JSON-LD (preserves blank node IDs)
      const itemJsonArray = await this.#rdfToJson(itemRdf);

      // Find the main item in the JSON-LD array (should match the itemIri)
      const mainItem =
        itemJsonArray.find((item) => item["@id"] === itemIri) ||
        itemJsonArray[0];

      if (mainItem) {
        items.push({
          subject: itemIri,
          rdf: itemRdf,
          json: JSON.stringify(mainItem),
        });
      }
    }

    return items;
  }

  /** @inheritdoc */
  async processItem(item) {
    const subject = item.subject;
    const descriptor = await this.#descriptorProcessor.process(item);
    const content = await this.#createContent(item);

    // Create and store the resource
    const resource = common.Message.fromObject({
      id: { subject },
      role: "system",
      content,
      descriptor,
    });

    await this.#resourceIndex.put(resource);
    return resource;
  }

  /**
   * Creates a content object from the batch item
   * @param {object} item - The RDF item with JSON-LD and N-Quads data
   * @returns {object} Content object
   */
  async #createContent(item) {
    return {
      nquads: item.rdf,
      jsonld: item.json,
      tokens: countTokens(item.json),
    };
  }
}
