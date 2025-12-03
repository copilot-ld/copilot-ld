/* eslint-env node */

/**
 * Static map of model names to their context window token budgets
 * Seeded from GitHub Copilot API via `npx env-cmd -- node scripts/models.js`
 * @type {Map<string, number>}
 */
export const MODEL_BUDGETS = new Map([
  ["gpt-4.1", 128000],
  ["gpt-4o", 128000],
  ["gpt-5", 400000],
  ["gpt-5-mini", 264000],
  // Test models with specific budgets for unit tests
  ["test-model-1000", 1000],
  ["test-model-125", 125],
  ["test-model-230", 230],
  ["test-model-300", 300],
]);

/**
 * Returns the token budget for a given model
 * @param {string} model - Model name
 * @returns {number} Token budget for the model
 * @throws {Error} If model is not found in MODEL_BUDGETS
 */
export function getModelBudget(model) {
  const budget = MODEL_BUDGETS.get(model);
  if (!budget) {
    throw new Error(
      `Unknown model: ${model}. Known models: ${[...MODEL_BUDGETS.keys()].join(", ")}`,
    );
  }
  return budget;
}
