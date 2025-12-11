/* eslint-env node */

/**
 * Static map of model names to their context window token budgets
 * Seeded from GitHub Copilot API via `npx env-cmd -- node scripts/models.js`
 * @type {Map<string, number>}
 */
export const BUDGETS = new Map([
  ["gpt-4.1", 128000],
  ["gpt-4o", 128000],
  ["gpt-5", 400000],
  ["gpt-5-mini", 264000],
]);

/**
 * Returns the token budget for a given model
 * @param {string} model - Model name
 * @returns {number} Token budget for the model
 * @throws {Error} If model is not found in MODEL_BUDGETS
 */
export function getBudget(model) {
  const budget = BUDGETS.get(model);
  if (!budget) {
    throw new Error(
      `Unknown model: ${model}. Known models: ${[...BUDGETS.keys()].join(", ")}`,
    );
  }
  return budget;
}
