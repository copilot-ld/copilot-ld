#!/usr/bin/env node
/* eslint-env node */
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import {
  Evaluator,
  Judge,
  MetricsCalculator,
  ReportGenerator,
} from "@copilot-ld/libeval";
import { createStorage } from "@copilot-ld/libstorage";
import { clients } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";

// Extract generated clients
const { LlmClient, AgentClient } = clients;

/**
 * Load test cases from config/eval.yml
 * @param {object} storage - Config storage instance
 * @param {string} caseId - Optional specific case ID to load
 * @returns {Promise<object[]>} Array of test cases
 */
async function loadTestCases(storage, caseId = null) {
  const evalYml = await storage.get("eval.yml");
  if (!evalYml) {
    throw new Error("config/eval.yml not found");
  }

  const testCaseObjects = yaml.load(evalYml);

  // Convert to array with IDs
  let cases = Object.entries(testCaseObjects).map(([id, testCase]) => ({
    id,
    ...testCase,
  }));

  // Filter to specific case if requested
  if (caseId) {
    cases = cases.filter((c) => c.id === caseId);
    if (cases.length === 0) {
      throw new Error(`Test case not found: ${caseId}`);
    }
  }

  return cases;
}

/**
 * Main evaluation workflow
 * @returns {Promise<void>} Resolves when evaluation is complete
 */
async function main() {
  const { values } = parseArgs({
    options: {
      concurrency: {
        type: "string",
        short: "c",
        default: "5",
      },
      case: {
        type: "string",
        short: "t",
      },
    },
  });

  const args = {
    concurrency: parseInt(values.concurrency, 10),
    case: values.case || null,
  };

  console.log("🔬 Evaluation System");
  console.log("====================\n");

  // Initialize storage
  const configStorage = createStorage("config");
  const resultsStorage = createStorage("eval");

  // Initialize clients
  console.log("Initializing clients...");
  const llmConfig = await ServiceConfig.create("llm");
  const agentConfig = await ServiceConfig.create("agent");

  const llmClient = new LlmClient(llmConfig);
  const agentClient = new AgentClient(agentConfig);

  // Get GitHub token from environment
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error("Error: GITHUB_TOKEN environment variable is required");
    process.exit(1);
  }

  // Load test cases
  console.log("Loading test cases...");
  const testCases = await loadTestCases(configStorage, args.case);
  console.log(`Loaded ${testCases.length} test case(s)\n`);

  // Create dependencies
  const judge = new Judge(llmClient, githubToken);
  const metrics = new MetricsCalculator();
  const reporter = new ReportGenerator();

  // Create evaluator with all dependencies
  const evaluator = new Evaluator(
    agentClient,
    githubToken,
    judge,
    metrics,
    reporter,
  );

  // Run evaluation
  console.log("Starting evaluation...\n");
  const results = await evaluator.evaluate(testCases, args.concurrency);

  // Generate reports
  console.log("\n");
  await evaluator.report(results, resultsStorage);

  // Print summary
  console.log("\n📊 Evaluation Summary");
  console.log("=====================");
  console.log(`Total Cases: ${results.totalCases}`);
  console.log(`Average Relevance: ${results.averageScores.relevance}/10`);
  console.log(`Average Accuracy: ${results.averageScores.accuracy}/10`);
  console.log(`Average Completeness: ${results.averageScores.completeness}/10`);
  console.log(`Average Coherence: ${results.averageScores.coherence}/10`);
  console.log(
    `Average Source Attribution: ${results.averageScores.sourceAttribution}/10`,
  );
  console.log(`\n✨ Overall Score: ${results.averageScores.overall}/10\n`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
