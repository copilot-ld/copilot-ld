/* eslint-env node */
import { common } from "@copilot-ld/libtype";

import { ChunkIndexInterface } from "./types.js";

/**
 * ChunkIndex class for managing chunk data with lazy loading
 * @implements {ChunkIndexInterface}
 * @deprecated This class will be replaced by `libresource` and new abstract types in the resource-based architecture
 */
export class ChunkIndex extends ChunkIndexInterface {
  #storage;
  #indexKey = "index.json";
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
      result[id] = new common.Chunk(data);
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
        result[id] = new common.Chunk(data);
      }
    }

    return result;
  }

  /**
   * Loads chunk data from disk
   * @returns {Promise<void>}
   * @throws {Error} When chunks directory or index file is not found
   */
  async loadData() {
    if (!(await this.#storage.exists(this.#indexKey))) {
      throw new Error(`Chunk index not found`);
    }

    const indexData = await this.#storage.get(this.#indexKey);
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
    await this.#storage.put(
      this.#indexKey,
      JSON.stringify(this.#index, null, 2),
    );
  }
}

/**
 * @deprecated This interface will be replaced by `libresource` and new abstract types in the resource-based architecture
 */
export { ChunkIndexInterface };
