/* eslint-env node */
import * as libtype from "@copilot-ld/libtype";

import { ChunkIndexInterface } from "./types.js";

/**
 * ChunkIndex class for managing chunk data with lazy loading
 * @implements {ChunkIndexInterface}
 */
export class ChunkIndex extends ChunkIndexInterface {
  #storage;
  #index = {};
  #chunks = {};
  #loaded = false;

  /** @inheritdoc */
  constructor(storage) {
    super(storage);
    this.#storage = storage;
  }

  /** @inheritdoc */
  storage() {
    return this.#storage;
  }

  /** @inheritdoc */
  async getAllChunks() {
    if (!this.#loaded) {
      await this.loadData();
    }

    const result = {};
    for (const [id, data] of Object.entries(this.#chunks)) {
      result[id] = new libtype.Chunk(data);
    }
    return result;
  }

  /** @inheritdoc */
  async getChunks(ids) {
    if (!this.#loaded) {
      await this.loadData();
    }

    const result = {};

    for (const id of ids) {
      if (this.#chunks[id]) {
        const data = this.#chunks[id];
        result[id] = new libtype.Chunk(data);
      }
    }

    return result;
  }

  /** @inheritdoc */
  getIndexPath() {
    return "index.json";
  }

  /**
   * Loads chunk data from disk
   * @returns {Promise<void>}
   * @throws {Error} When chunks directory or index file is not found
   */
  async loadData() {
    const indexKey = "index.json";
    if (!(await this.#storage.exists(indexKey))) {
      throw new Error(`Chunk index not found: ${indexKey}`);
    }

    const indexData = await this.#storage.get(indexKey);
    this.#index = JSON.parse(indexData.toString());

    this.#chunks = {};
    for (const [id, chunk] of Object.entries(this.#index)) {
      const chunkKey = `${id}/chunk.json`;
      if (await this.#storage.exists(chunkKey)) {
        const text = await this.#storage.get(chunkKey);
        this.#chunks[id] = { ...chunk, text: text.toString() };
      }
    }

    this.#loaded = true;
  }

  /** @inheritdoc */
  addChunk(data) {
    this.#index[data.id] = data;
  }

  /** @inheritdoc */
  async persist() {
    await this.#storage.put("index.json", JSON.stringify(this.#index, null, 2));
  }
}

export { ChunkIndexInterface };
