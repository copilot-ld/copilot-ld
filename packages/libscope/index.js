/* eslint-env node */

/** @typedef {import("@copilot-ld/libvector").VectorIndex} VectorIndex */
/** @typedef {import("@copilot-ld/libtype").Similarity} Similarity */

/**
 * Resolves scope keys from a vector using similarity search
 * Queries the scope index and votes on scopes based on similarity scores
 * @param {number[]} vector - The input vector for similarity search
 * @param {VectorIndex} scopeIndex - VectorIndex instance containing scope vectors with metadata
 * @param {number} limit - Maximum number of results to consider (default: 3)
 * @returns {Promise<string[]>} Array of unique scope keys, with top scope first
 */
export async function resolveScope(vector, scopeIndex, limit = 3) {
  const results = await scopeIndex.queryItems(vector, 0, limit);

  if (results.length === 0) return [];

  const scopeVotes = {};
  results.forEach((vectorResult) => {
    const scope = vectorResult.scope;
    scopeVotes[scope] = (scopeVotes[scope] || 0) + vectorResult.score;
  });

  const entries = Object.entries(scopeVotes);
  if (entries.length === 0) {
    return [];
  }

  const topScope = entries.reduce((a, b) =>
    scopeVotes[a[0]] > scopeVotes[b[0]] ? a : b,
  )[0];

  return [topScope];
}
