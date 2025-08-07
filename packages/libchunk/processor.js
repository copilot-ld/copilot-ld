/* eslint-env node */
import crypto from "crypto";

import { format } from "prettier";
import { microdata } from "microdata-minimal";

import { Chunk } from "@copilot-ld/libtype";
import { Copilot } from "@copilot-ld/libcopilot";

/** @typedef {import("@copilot-ld/libtype").ChunkIndexInterface} ChunkIndexInterface */
/** @typedef {import("@copilot-ld/libtype").StorageInterface} StorageInterface */

/**
 * ChunkProcessor class for batch processing HTML files into chunks
 */
export class ChunkProcessor {
  #chunkIndex;
  #knowledgeStorage;

  /**
   * Creates a new ChunkProcessor instance
   * @param {ChunkIndexInterface} chunkIndex - ChunkIndex instance to add chunks to
   * @param {StorageInterface} knowledgeStorage - Storage interface for knowledge base operations
   */
  constructor(chunkIndex, knowledgeStorage) {
    this.#chunkIndex = chunkIndex;
    this.#knowledgeStorage = knowledgeStorage;
  }

  /**
   * Persists the chunk index to disk
   * @returns {Promise<void>}
   */
  async persist() {
    await this.#chunkIndex.persist();
  }

  /**
   * Processes all HTML files in the specified directory
   * @param {string} extension - File extension to search for (default: ".html")
   * @param {string[]} selectors - Array of CSS selectors to filter microdata items (default: [])
   * @returns {Promise<void>}
   * @throws {Error} When file processing fails
   */
  async process(extension = ".html", selectors = []) {
    const keys = await this.#knowledgeStorage.find(extension);

    for (const key of keys) {
      console.log(`Processing: ${key}`);

      const html = await this.#knowledgeStorage.get(key);
      const items = await this.#parseHTML(html, selectors);

      for (let i = 0; i < items.length; i++) {
        console.log(`  Processing ${i + 1}/${items.length}`);

        const chunk = await this.#createChunk(items[i]);

        this.#chunkIndex.addChunk(chunk);
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
    return microdata(htmlContent, selectors);
  }

  /**
   * Creates an ID for a chunk using SHA256 hash
   * @param {string} htmlContent - The HTML content to create an id for
   * @returns {string} The first 16 characters of SHA256 hash
   */
  #createId(htmlContent) {
    return crypto
      .createHash("sha256")
      .update(htmlContent)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Creates a chunk object from a microdata item
   * @param {object} item - The microdata item to create a chunk for
   * @returns {Promise<Chunk>} The created Chunk instance
   */
  async #createChunk(item) {
    const _tempId = item["@id"];
    const raw = JSON.stringify(item);
    const formatted = await format(raw, { parser: "json" });
    const text = formatted.toString();

    const id = this.#createId(text);
    const tokens = Copilot.countTokens(text);

    // Store the chunk data using storage interface
    const chunkKey = `${id}/chunk.json`;
    await this.#chunkIndex.storage().put(chunkKey, text);

    // TODO: Also write the HTML chunk for debugging purposes
    //const htmlKey = `${id}/chunk.html`;
    //await this.#chunkIndex.storage().put(htmlKey, item.toHTML());

    return new Chunk({ id, tokens });
  }
}
