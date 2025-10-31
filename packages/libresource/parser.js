/* eslint-env node */

import { minify } from "html-minifier-terser";
import jsonld from "jsonld";
import { MicrodataRdfParser } from "microdata-rdf-streaming-parser";
import { Writer, Parser as N3Parser } from "n3";

/** Parser for converting HTML with microdata to structured RDF items */
export class Parser {
  #skolemizer;
  #logger;

  /**
   * Creates a new Parser instance
   * @param {object} skolemizer - Blank node skolemizer
   * @param {object} logger - Logger instance
   */
  constructor(skolemizer, logger) {
    if (!skolemizer) throw new Error("skolemizer is required");
    this.#skolemizer = skolemizer;
    this.#logger = logger || { debug: () => {} };
  }

  /**
   * Parses HTML DOM and extracts structured items
   * @param {object} dom - JSDOM instance
   * @param {string} baseIri - Base IRI for parsing
   * @returns {Promise<Array>} Array of extracted items with RDF and JSON-LD
   */
  async parseHTML(dom, baseIri) {
    const minifiedHtml = await this.#minifyHTML(dom.serialize());
    const allQuads = await this.#extractQuads(minifiedHtml, baseIri);

    if (!allQuads || allQuads.length === 0) {
      this.#logger.debug("No RDF data found in HTML content");
      return [];
    }

    const itemGroups = this.#groupQuadsByItem(allQuads);
    const items = [];

    for (const [itemIri, itemQuads] of itemGroups) {
      const itemRdf = await this.quadsToRdf(itemQuads);
      const itemJsonArray = await this.#rdfToJson(itemRdf);
      const mainItem =
        itemJsonArray.find((item) => item["@id"] === itemIri) ||
        itemJsonArray[0];

      if (mainItem) {
        items.push({
          iri: itemIri,
          quads: itemQuads,
          rdf: itemRdf,
          json: JSON.stringify(mainItem),
        });
      }
    }
    return items;
  }

  /**
   * Converts RDF quads to N-Quads format string
   * @param {Array} quads - Array of RDF quads
   * @returns {Promise<string>} RDF in N-Quads format
   */
  async quadsToRdf(quads) {
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
   * Parses N-Quads string back into quad objects
   * @param {string} nquads - N-Quads format RDF string
   * @returns {Promise<Array>} Array of RDF quads
   */
  async rdfToQuads(nquads) {
    return new Promise((resolve, reject) => {
      const parser = new N3Parser({ format: "N-Quads" });
      const quads = [];

      parser.parse(nquads, (error, quad) => {
        if (error) {
          reject(new Error(`N-Quads parsing failed: ${error.message}`));
        } else if (quad) {
          quads.push(quad);
        } else {
          resolve(quads);
        }
      });
    });
  }

  /**
   * Unions two arrays of quads using RDF semantics (deduplicates identical triples)
   * @param {Array} existingQuads - Array of existing RDF quads
   * @param {Array} newQuads - Array of new RDF quads to merge
   * @returns {Array} Merged array of unique quads
   */
  unionQuads(existingQuads, newQuads) {
    const quadMap = new Map();

    const addQuad = (quad) => {
      // Build a complete key that uniquely identifies the quad
      let objectKey = quad.object.value;
      if (quad.object.termType === "Literal") {
        objectKey += `|${quad.object.datatype?.value || ""}|${quad.object.language || ""}`;
      }
      const key = `${quad.subject.value}|${quad.predicate.value}|${objectKey}|${quad.object.termType}`;
      quadMap.set(key, quad);
    };

    existingQuads.forEach(addQuad);
    newQuads.forEach(addQuad);

    return Array.from(quadMap.values());
  }

  /**
   * Converts RDF to JSON-LD format
   * @param {string} rdf - RDF in N-Quads format
   * @returns {Promise<Array>} Array of JSON-LD objects
   */
  async rdfToJson(rdf) {
    return this.#rdfToJson(rdf);
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
}
