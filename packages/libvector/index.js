/* eslint-env node */

import { resource } from "@copilot-ld/libtype";
import { IndexBase } from "@copilot-ld/libutil";

/**
 * VectorIndex class for managing vector data with lazy loading
 */
export class VectorIndex extends IndexBase {
  /**
   * Adds a vector item to the index
   * @param {resource.Identifier} identifier - Resource identifier
   * @param {number[]} vector - The vector
   * @returns {Promise<void>}
   */
  async addItem(identifier, vector) {
    const item = {
      id: String(identifier),
      identifier,
      vector,
    };

    // Use parent class to update index in memory and on disk
    await super.addItem(item);
  }

  /**
   * Queries items from this vector index using cosine similarity
   * @param {number[]} query - Query vector
   * @param {import("@copilot-ld/libtype").tool.QueryFilter} filter - Filter object for query constraints
   * @returns {Promise<resource.Identifier[]>} Array of resource identifiers sorted by score
   */
  async queryItems(query, filter = {}) {
    if (!this.loaded) await this.loadData();

    const { threshold = 0, limit = 0, prefix, max_tokens } = filter;
    const identifiers = [];

    for (const item of this.index.values()) {
      if (!this._applyPrefixFilter(item.id, prefix)) continue;
      const score = calculateDotProduct(query, item.vector, query.length);
      if (score >= threshold) {
        item.identifier.score = score;
        identifiers.push(resource.Identifier.fromObject(item.identifier));
      }
    }

    identifiers.sort((a, b) => b.score - a.score);

    // Apply shared filters
    let results = this._applyLimitFilter(identifiers, limit);
    results = this._applyTokensFilter(results, max_tokens);

    return results;
  }
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
