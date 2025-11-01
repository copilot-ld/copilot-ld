/* eslint-env node */

/**
 * Generate evaluation reports in multiple formats
 */
export class ReportGenerator {
  /**
   * Generate markdown and JSON reports from evaluation results
   * @param {object[]} results - Array of evaluation results
   * @param {object} storage - Storage instance for writing reports
   * @returns {Promise<void>} Resolves when reports are written
   */
  async generate(results, storage) {
    const timestamp = new Date().toISOString().split("T")[0];
    const runId = `run-${timestamp}-${Date.now().toString().slice(-3)}`;

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    const passRate = ((passedCount / totalCount) * 100).toFixed(1);

    let markdown = `# Evaluation Report: ${runId}\n\n`;
    markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Cases**: ${totalCount}\n`;
    markdown += `- **Passed**: ${passedCount}\n`;
    markdown += `- **Failed**: ${totalCount - passedCount}\n`;
    markdown += `- **Pass Rate**: ${passRate}%\n\n`;

    // Group by type
    const byType = {
      criteria: results.filter((r) => r.type === "criteria"),
      retrieval: results.filter((r) => r.type === "retrieval"),
      trace: results.filter((r) => r.type === "trace"),
    };

    for (const [type, cases] of Object.entries(byType)) {
      if (cases.length === 0) continue;

      const typePassed = cases.filter((c) => c.passed).length;
      markdown += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Cases\n\n`;
      markdown += `- Total: ${cases.length}\n`;
      markdown += `- Passed: ${typePassed}\n`;
      markdown += `- Failed: ${cases.length - typePassed}\n\n`;
    }

    // Add test summary list
    markdown += `## Test Summary\n\n`;
    for (const result of results) {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      markdown += `- ${status} - \`${result.caseId}\` (${result.type})\n`;
    }
    markdown += `\n`;

    // Add debugging section for failed tests
    const failedTests = results.filter((r) => !r.passed);
    if (failedTests.length > 0) {
      markdown += `## Debugging Failed Tests\n\n`;
      markdown += `Use the following information to debug failed test cases:\n\n`;

      for (const result of failedTests) {
        if (!result.conversationId) continue;

        markdown += `### ${result.caseId}\n\n`;
        markdown += `**Query**: ${result.query}\n\n`;
        markdown += `**Conversation ID**: \`${result.conversationId}\`\n\n`;
        markdown += `**Resources**:\n`;
        markdown += `- Memory: [\`data/memories/${result.conversationId}.jsonl\`](../memories/${result.conversationId}.jsonl)\n`;
        markdown += `- Resource directory: [\`data/resources/${result.conversationId}/\`](../resources/${result.conversationId}/)\n\n`;
        markdown += `**Trace Query**:\n`;
        markdown += `\`\`\`bash\n`;
        markdown += `jq 'select(.resource_id == "${result.conversationId}")' data/traces/*.jsonl\n`;
        markdown += `\`\`\`\n\n`;
      }
    }

    markdown += `## Detailed Results\n\n`;

    for (const result of results) {
      markdown += `### ${result.passed ? "✅" : "❌"} ${result.caseId}\n\n`;
      markdown += `**Type**: ${result.type}\n`;
      markdown += `**Query**: ${result.query}\n`;
      
      // Add conversation ID for debugging
      if (result.conversationId) {
        markdown += `**Conversation ID**: \`${result.conversationId}\`\n`;
      }
      markdown += `\n`;

      if (result.type === "criteria") {
        markdown += `**Judgment**:\n${result.judgment}\n\n`;
      } else if (result.type === "retrieval") {
        markdown += `**Retrieved**: ${result.retrievedCount} total, ${result.uniqueCount} unique\n\n`;
        markdown += `**Recall**: ${(result.metrics.recall.value * 100).toFixed(1)}% (threshold: ${(result.metrics.recall.threshold * 100).toFixed(0)}%) - ${result.metrics.recall.passed ? "PASS" : "FAIL"}\n`;
        markdown += `- Found: ${result.metrics.recall.found.length} subjects\n`;
        if (result.metrics.recall.found.length > 0) {
          for (const subject of result.metrics.recall.found) {
            markdown += `  - ✅ ${subject}\n`;
          }
        }
        if (result.metrics.recall.missing.length > 0) {
          markdown += `- Missing: ${result.metrics.recall.missing.length} subjects\n`;
          for (const subject of result.metrics.recall.missing) {
            markdown += `  - ❌ ${subject}\n`;
          }
        }
        markdown += `\n`;
        markdown += `**Precision**: ${(result.metrics.precision.value * 100).toFixed(1)}% (threshold: ${(result.metrics.precision.threshold * 100).toFixed(0)}%) - ${result.metrics.precision.passed ? "PASS" : "FAIL"}\n\n`;
        
        // Add response text for retrieval tests
        if (result.response) {
          markdown += `**Response**:\n\`\`\`\n${result.response}\n\`\`\`\n\n`;
        }
      } else if (result.type === "trace") {
        markdown += `**Trace Span Count**: ${result.traceCount}\n\n`;
        markdown += `**Checks**:\n`;
        for (const check of result.checks) {
          markdown += `- ${check.passed ? "✅" : "❌"} \`${check.command}\`\n`;
        }
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    }

    await storage.put(`${runId}.md`, markdown);
    await storage.put(`${runId}.json`, JSON.stringify(results, null, 2));

    console.log(`Markdown report written to: data/eval/${runId}.md`);
    console.log(`JSON report written to: data/eval/${runId}.json`);
  }
}
