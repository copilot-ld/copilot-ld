/* eslint-env node */

import { resource } from "@copilot-ld/libtype";

import { VectorIndexInterface } from "./types.js";

/** @typedef {import("@copilot-ld/libconfig").ConfigInterface} ConfigInterface */

/**
 * VectorIndex class for managing vector data with lazy loading
 * @implements {VectorIndexInterface}
 */
export class VectorIndex extends VectorIndexInterface {
  #storage;
  #indexKey;
  #index = [];
  #loaded = false;

  /** @inheritdoc */
  constructor(storage, indexKey = "index.jsonl") {
    super(storage);
    this.#storage = storage;
    this.#indexKey = indexKey;
  }

  /** @inheritdoc */
  storage() {
    return this.#storage;
  }

  /**
   * Gets the index key (filename)
   * @returns {string} The index key
   */
  get indexKey() {
    return this.#indexKey;
  }

  /** @inheritdoc */
  async addItem(vector, identifier) {
    if (!this.#loaded) await this.loadData();

    identifier.magnitude = calculateMagnitude(vector);
    const item = {
      uri: String(identifier),
      identifier,
      vector,
    };

    const i = this.#index.findIndex(
      (item) => item.identifier.id === identifier.id,
    );
    if (i !== -1) {
      this.#index[i] = item;
    } else {
      this.#index.push(item);
    }

    // Append item to storage as JSON-ND line
    const jsonLine = JSON.stringify(item) + "\n";
    await this.#storage.append(this.#indexKey, jsonLine);
  }

  /** @inheritdoc */
  async hasItem(id) {
    if (!this.#loaded) await this.loadData();
    return this.#index.some((item) => item.identifier.id === id);
  }

  /** @inheritdoc */
  async loadData() {
    if (!(await this.#storage.exists(this.#indexKey))) {
      // Initialize empty index for new systems
      this.#index = [];
      this.#loaded = true;
      return;
    }

    const content = await this.#storage.get(this.#indexKey);
    const lines = content.toString().trim().split("\n");
    this.#index = lines
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
    this.#loaded = true;
  }

  /** @inheritdoc */
  async persist() {
    const content = this.#index.map((item) => JSON.stringify(item)).join("\n");
    await this.#storage.put(this.#indexKey, content);
  }

  /** @inheritdoc */
  async queryItems(query, filter = {}) {
    if (!this.#loaded) await this.loadData();

    const { threshold = 0, limit = 0, max_tokens, prefix } = filter;
    const queryMagnitude = calculateMagnitude(query);
    const identifiers = limit > 0 ? new Array(limit) : [];
    let count = 0;
    let minScore = threshold;

    for (const item of this.#index) {
      // Apply prefix filter if specified
      if (prefix && !item.uri.startsWith(prefix)) {
        continue;
      }

      const dotProduct = calculateDotProduct(query, item.vector, query.length);
      const score = dotProduct / (queryMagnitude * item.identifier.magnitude);

      // Efficiently maintain top K results without full sort per item
      if (score >= minScore) {
        item.identifier.score = score;
        const identifier = new resource.Identifier(item.identifier);

        if (limit > 0) {
          if (count < limit) {
            identifiers[count++] = identifier;
            // Sort and set threshold once limit is reached
            if (count === limit) {
              identifiers.sort((a, b) => b.score - a.score);
              minScore = identifiers[limit - 1].score;
            }
          } else if (score > minScore) {
            // Insert result in sorted position
            let insertIndex = limit - 1;
            while (
              insertIndex > 0 &&
              identifiers[insertIndex - 1].score < score
            ) {
              identifiers[insertIndex] = identifiers[insertIndex - 1];
              insertIndex--;
            }
            identifiers[insertIndex] = identifier;
            // Update threshold to maintain top-K constraint
            minScore = identifiers[limit - 1].score;
          }
        } else {
          identifiers.push(identifier);
        }
      }
    }

    let finalIdentifiers;
    if (limit > 0) {
      finalIdentifiers = identifiers
        .slice(0, count)
        .sort((a, b) => b.score - a.score);
    } else {
      finalIdentifiers = identifiers.sort((a, b) => b.score - a.score);
    }

    // Apply token filtering if max_tokens is specified
    if (max_tokens !== undefined && max_tokens !== null) {
      const filteredIdentifiers = [];
      let totalTokens = 0;

      for (const identifier of finalIdentifiers) {
        const identifierTokens = identifier.tokens || 0;
        if (totalTokens + identifierTokens <= max_tokens) {
          filteredIdentifiers.push(identifier);
          totalTokens += identifierTokens;
        } else {
          break; // Stop when we would exceed token limit
        }
      }

      return filteredIdentifiers;
    }

    return finalIdentifiers;
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
