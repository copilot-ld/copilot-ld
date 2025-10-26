/* eslint-env node */

/**
 * Calculate and aggregate evaluation metrics across test cases
 */
export class MetricsCalculator {
  /**
   * Aggregate results from multiple test case evaluations
   * @param {object[]} results - Array of evaluation results
   * @returns {object} Aggregated metrics with summary statistics
   */
  aggregate(results) {
    if (!results || results.length === 0) {
      return {
        totalCases: 0,
        averageScores: {
          relevance: 0,
          accuracy: 0,
          completeness: 0,
          coherence: 0,
          sourceAttribution: 0,
          overall: 0,
        },
        results: [],
      };
    }

    const scores = {
      relevance: [],
      accuracy: [],
      completeness: [],
      coherence: [],
      sourceAttribution: [],
      overall: [],
    };

    // Collect all scores
    for (const result of results) {
      scores.relevance.push(result.scores.relevance);
      scores.accuracy.push(result.scores.accuracy);
      scores.completeness.push(result.scores.completeness);
      scores.coherence.push(result.scores.coherence);
      scores.sourceAttribution.push(result.scores.sourceAttribution);
      scores.overall.push(result.scores.average);
    }

    // Calculate averages
    const averageScores = {
      relevance: this.#average(scores.relevance),
      accuracy: this.#average(scores.accuracy),
      completeness: this.#average(scores.completeness),
      coherence: this.#average(scores.coherence),
      sourceAttribution: this.#average(scores.sourceAttribution),
      overall: this.#average(scores.overall),
    };

    return {
      totalCases: results.length,
      averageScores,
      results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate average of an array of numbers
   * @param {number[]} numbers - Array of numbers
   * @returns {number} Average rounded to 2 decimal places
   */
  #average(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    return Math.round((sum / numbers.length) * 100) / 100;
  }
}
