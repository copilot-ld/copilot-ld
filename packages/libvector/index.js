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
  async addItem(id, vector, tokens = 0, scope = null) {
    if (!this.#loaded) await this.loadData();

    const item = {
      id,
      vector,
      magnitude: calculateMagnitude(vector),
      tokens,
      scope,
    };

    const i = this.#index.findIndex((item) => item.id === id);
    if (i !== -1) {
      this.#index[i] = item;
    } else {
      this.#index.push(item);
    }
  }

  /** @inheritdoc */
  async hasItem(id) {
    if (!this.#loaded) await this.loadData();
    return this.#index.some((item) => item.id === id);
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
    const results = limit > 0 ? new Array(limit) : [];
    let resultCount = 0;
    let minScore = threshold;

    for (const vectorItem of this.#index) {
      const dotProduct = calculateDotProduct(
        query,
        vectorItem.vector,
        query.length,
      );
      const score = dotProduct / (queryMagnitude * vectorItem.magnitude);

      // Efficiently maintain top K results without full sort per item
      if (score >= minScore) {
        const similarity = new common.Similarity({
          id: vectorItem.id,
          score,
          tokens: vectorItem.tokens,
          scope: vectorItem.scope,
        });

        if (limit > 0) {
          if (resultCount < limit) {
            results[resultCount++] = similarity;
            // Sort and set threshold once limit is reached
            if (resultCount === limit) {
              results.sort((a, b) => b.score - a.score);
              minScore = results[limit - 1].score;
            }
          } else if (score > minScore) {
            // Insert result in sorted position
            let insertIndex = limit - 1;
            while (insertIndex > 0 && results[insertIndex - 1].score < score) {
              results[insertIndex] = results[insertIndex - 1];
              insertIndex--;
            }
            results[insertIndex] = similarity;
            // Update threshold to maintain top-K constraint
            minScore = results[limit - 1].score;
          }
        } else {
          results.push(similarity);
        }
      }
    }

    if (limit > 0) {
      return results.slice(0, resultCount).sort((a, b) => b.score - a.score);
    }
    return results.sort((a, b) => b.score - a.score);
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
