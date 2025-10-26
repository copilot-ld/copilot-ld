#!/usr/bin/env node
/* eslint-env node */
import yaml from "js-yaml";
import { Evaluator } from "@copilot-ld/libeval";
import { createStorage } from "@copilot-ld/libstorage";
import { clients } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";

// Extract generated clients
const { LlmClient, AgentClient } = clients;

/**
 * Parse command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = {
    concurrency: 5,
    case: null,
    reportOnly: false,
    input: null,
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === "--concurrency" && i + 1 < process.argv.length) {
      args.concurrency = parseInt(process.argv[++i], 10);
    } else if (arg === "--case" && i + 1 < process.argv.length) {
      args.case = process.argv[++i];
    } else if (arg === "--report-only") {
      args.reportOnly = true;
    } else if (arg === "--input" && i + 1 < process.argv.length) {
      args.input = process.argv[++i];
    }
  }

  return args;
}

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
  const args = parseArgs();

  console.log("🔬 BioNova Evaluation System");
  console.log("============================\n");

  // Initialize storage
  const configStorage = createStorage("config");
  const resultsStorage = createStorage("eval");

  // Handle report-only mode
  if (args.reportOnly) {
    if (!args.input) {
      console.error("Error: --report-only requires --input <file>");
      process.exit(1);
    }

    console.log(`Generating report from: ${args.input}`);
    const resultsJson = await resultsStorage.get(args.input);
    const results = JSON.parse(resultsJson);

    const evaluator = new Evaluator(null, null, "dummy");
    await evaluator.report(results, resultsStorage);
    return;
  }

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

  // Create evaluator
  const evaluator = new Evaluator(llmClient, agentClient, githubToken);

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
