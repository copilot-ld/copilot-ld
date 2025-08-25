/* eslint-env node */

import { common } from "@copilot-ld/libtype";

import { VectorIndexInterface } from "./types.js";

/** @typedef {import("@copilot-ld/libconfig").ConfigInterface} ConfigInterface */

/**
 * VectorIndex class for managing vector data with lazy loading
 * @implements {VectorIndexInterface}
 */
export class VectorIndex extends VectorIndexInterface {
  #storage;
  #indexKey = "index.json";
  #index = [];
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
  async addItem(vector, meta) {
    if (!this.#loaded) await this.loadData();

    meta.magnitude = calculateMagnitude(vector);
    const item = {
      vector,
      meta
    };

    const i = this.#index.findIndex((item) => item.meta.id === meta.id);
    if (i !== -1) {
      this.#index[i] = item;
    } else {
      this.#index.push(item);
    }
  }

  /** @inheritdoc */
  async hasItem(id) {
    if (!this.#loaded) await this.loadData();
    return this.#index.some((item) => item.meta.id === id);
  }

  /** @inheritdoc */
  async loadData() {
    if (!(await this.#storage.exists(this.#indexKey))) {
      throw new Error(`Vector index not found`);
    }

    const content = await this.#storage.get(this.#indexKey);
    this.#index = JSON.parse(content.toString());
    this.#loaded = true;
  }

  /** @inheritdoc */
  async persist() {
    await this.#storage.put(this.#indexKey, JSON.stringify(this.#index));
  }

  /** @inheritdoc */
  async queryItems(query, threshold = 0, limit = 0) {
    if (!this.#loaded) await this.loadData();

    const queryMagnitude = calculateMagnitude(query);
    const resources = limit > 0 ? new Array(limit) : [];
    let count = 0;
    let minScore = threshold;

    for (const item of this.#index) {
      const dotProduct = calculateDotProduct(
        query,
        item.vector,
        query.length,
      );
      const score = dotProduct / (queryMagnitude * item.meta.magnitude);

      // Efficiently maintain top K results without full sort per item
      if (score >= minScore) {
        item.meta.score = score;
        const resource = new common.Resource(item.meta);

        if (limit > 0) {
          if (count < limit) {
            resources[count++] = resource;
            // Sort and set threshold once limit is reached
            if (count === limit) {
              resources.sort((a, b) => b.score - a.score);
              minScore = resources[limit - 1].score;
            }
          } else if (score > minScore) {
            // Insert result in sorted position
            let insertIndex = limit - 1;
            while (insertIndex > 0 && resources[insertIndex - 1].score < score) {
              resources[insertIndex] = resources[insertIndex - 1];
              insertIndex--;
            }
            resources[insertIndex] = resource;
            // Update threshold to maintain top-K constraint
            minScore = resources[limit - 1].score;
          }
        } else {
          resources.push(resource);
        }
      }
    }

    if (limit > 0) {
      return resources.slice(0, count).sort((a, b) => b.score - a.score);
    }
    return resources.sort((a, b) => b.score - a.score);
  }
}

/**
 * Magnitude calculation with loop unrolling
 * @param {number[]} vector - The vector to calculate magnitude for
 * @returns {number} The magnitude of the vector
 */
function calculateMagnitude(vector) {
  let sum = 0;
  let i = 0;
  const length = vector.length;

  for (; i < length - 3; i += 4) {
    const v0 = vector[i];
    const v1 = vector[i + 1];
    const v2 = vector[i + 2];
    const v3 = vector[i + 3];
    sum += v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
  }

  for (; i < length; i++) {
    const v = vector[i];
    sum += v * v;
  }

  return Math.sqrt(sum);
}

/**
 * Dot product calculation with loop unrolling
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @param {number} length - Length of vectors
 * @returns {number} The dot product of the two vectors
 */
function calculateDotProduct(a, b, length) {
  let dotProduct = 0;
  let i = 0;

  for (; i < length - 7; i += 8) {
    dotProduct +=
      a[i] * b[i] +
      a[i + 1] * b[i + 1] +
      a[i + 2] * b[i + 2] +
      a[i + 3] * b[i + 3] +
      a[i + 4] * b[i + 4] +
      a[i + 5] * b[i + 5] +
      a[i + 6] * b[i + 6] +
      a[i + 7] * b[i + 7];
  }

  for (; i < length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}

export { VectorIndexInterface };
export { VectorProcessor } from "./processor.js";
