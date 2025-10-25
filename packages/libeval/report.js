/* eslint-env node */

/**
 * Generate evaluation reports in multiple formats
 */
export class ReportGenerator {
  /**
   * Generate markdown report from evaluation results
   * @param {object} aggregatedResults - Aggregated evaluation results
   * @param {object} storage - Storage instance for writing reports
   * @returns {Promise<void>} Resolves when report is written
   */
  async generateMarkdown(aggregatedResults, storage) {
    const timestamp = new Date().toISOString().split("T")[0];
    const runId = `run-${timestamp}-${Date.now().toString().slice(-3)}`;

    const markdown = this.#buildMarkdownReport(aggregatedResults, runId);

    await storage.put(`${runId}.md`, markdown);
    console.log(`Markdown report written to: data/evalresults/${runId}.md`);
  }

  /**
   * Generate JSON report from evaluation results
   * @param {object} aggregatedResults - Aggregated evaluation results
   * @param {object} storage - Storage instance for writing reports
   * @returns {Promise<void>} Resolves when report is written
   */
  async generateJSON(aggregatedResults, storage) {
    const timestamp = new Date().toISOString().split("T")[0];
    const runId = `run-${timestamp}-${Date.now().toString().slice(-3)}`;

    const json = JSON.stringify(aggregatedResults, null, 2);

    await storage.put(`${runId}.json`, json);
    console.log(`JSON report written to: data/evalresults/${runId}.json`);
  }

  /**
   * Build markdown report content
   * @param {object} results - Aggregated evaluation results
   * @param {string} runId - Run identifier
   * @returns {string} Markdown report content
   */
  #buildMarkdownReport(results, runId) {
    const { totalCases, averageScores, results: caseResults } = results;

    let markdown = `# Evaluation Report: ${runId}\n\n`;
    markdown += `**Generated**: ${new Date().toISOString()}\n\n`;

    // Summary section
    markdown += `## Summary\n\n`;
    markdown += `- **Total Cases**: ${totalCases}\n`;
    markdown += `- **Average Relevance**: ${averageScores.relevance}/10\n`;
    markdown += `- **Average Accuracy**: ${averageScores.accuracy}/10\n`;
    markdown += `- **Average Completeness**: ${averageScores.completeness}/10\n`;
    markdown += `- **Average Coherence**: ${averageScores.coherence}/10\n`;
    markdown += `- **Average Source Attribution**: ${averageScores.sourceAttribution}/10\n\n`;
    markdown += `### Overall Score: ${averageScores.overall}/10\n\n`;

    // Detailed results
    markdown += `## Detailed Results\n\n`;

    for (const result of caseResults) {
      const caseScore = result.scores.average;

      markdown += `### Case: ${result.caseId}\n\n`;
      markdown += `**Query**: ${result.query}\n\n`;
      markdown += `**Metrics**:\n`;
      markdown += `- Relevance: ${result.scores.relevance}/10\n`;
      markdown += `- Accuracy: ${result.scores.accuracy}/10\n`;
      markdown += `- Completeness: ${result.scores.completeness}/10\n`;
      markdown += `- Coherence: ${result.scores.coherence}/10\n`;
      markdown += `- Source Attribution: ${result.scores.sourceAttribution}/10\n`;
      markdown += `- **Case Score**: ${caseScore}/10\n\n`;

      // Response preview (first 500 chars)
      const responsePreview =
        result.response.length > 500
          ? result.response.substring(0, 500) + "..."
          : result.response;
      markdown += `**Response Preview**:\n\`\`\`\n${responsePreview}\n\`\`\`\n\n`;
      markdown += `---\n\n`;
    }

    return markdown;
  }
}
