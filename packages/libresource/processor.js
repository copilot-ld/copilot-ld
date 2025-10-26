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
   *
   * @param baseIri
   * @param resourceIndex
   * @param knowledgeStorage
   * @param skolemizer
   * @param describer
   * @param logger
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
   *
   * @param extension
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
   *
   * @param dom
   * @param key
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
   *
   * @param html
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
   *
   * @param html
   * @param baseIri
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
   *
   * @param quads
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
   *
   * @param allQuads
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
   *
   * @param rdf
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
   *
   * @param dom
   * @param baseIri
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
   *
   * @param item
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
   *
   * @param item
   */
  async #createContent(item) {
    return {
      nquads: item.rdf,
      jsonld: item.json,
      tokens: countTokens(item.json),
    };
  }
}
