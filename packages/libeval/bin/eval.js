#!/usr/bin/env node
/* eslint-env node */
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import {
  Evaluator,
  CriteriaEvaluator,
  RetrievalEvaluator,
  TraceEvaluator,
  ReportGenerator,
} from "@copilot-ld/libeval";
import { createStorage } from "@copilot-ld/libstorage";
import { clients } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";

// Extract generated clients
const { LlmClient, AgentClient, MemoryClient, TraceClient } = clients;

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
  const tempStorage = createStorage("tmp");

  // Initialize clients
  console.log("Initializing clients...");
  const llmConfig = await createServiceConfig("llm");
  const agentConfig = await createServiceConfig("agent");
  const memoryConfig = await createServiceConfig("memory");
  const traceConfig = await createServiceConfig("trace");

  const llmClient = new LlmClient(llmConfig);
  const agentClient = new AgentClient(agentConfig);
  const memoryClient = new MemoryClient(memoryConfig);
  const traceClient = new TraceClient(traceConfig);

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

  // Create evaluators
  const criteriaEvaluator = new CriteriaEvaluator(llmClient, githubToken);
  const retrievalEvaluator = new RetrievalEvaluator(memoryClient);
  const traceEvaluator = new TraceEvaluator(traceClient, tempStorage);

  // Create report generator
  const reporter = new ReportGenerator();

  // Create main evaluator with all dependencies
  const evaluator = new Evaluator(
    agentClient,
    memoryClient,
    traceClient,
    githubToken,
    criteriaEvaluator,
    retrievalEvaluator,
    traceEvaluator,
  );

  // Run evaluation
  console.log("Starting evaluation...\n");
  const results = await evaluator.evaluate(testCases, args.concurrency);

  // Generate reports
  console.log("\n");
  await reporter.generate(results, resultsStorage);

  // Print summary
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const passRate = ((passedCount / totalCount) * 100).toFixed(1);

  console.log("\n📊 Evaluation Summary");
  console.log("=====================");
  console.log(`Total Cases: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  // Print all test results
  console.log("Test Results:");
  console.log("-------------");
  for (const result of results) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.caseId} (${result.type})`);
  }

  // Print debugging information for failed tests
  const failedTests = results.filter((r) => !r.passed);
  if (failedTests.length > 0) {
    console.log("\n🔍 Debug Failed Tests:");
    console.log("=====================");
    for (const result of failedTests) {
      if (!result.conversationId) continue;
      console.log(`\n${result.caseId}:`);
      console.log(`  Conversation ID: ${result.conversationId}`);
      console.log(`  Memory: data/memories/${result.conversationId}.jsonl`);
      console.log(`  Resources: data/resources/${result.conversationId}/`);
      console.log(`  Traces: jq 'select(.resource_id == "${result.conversationId}")' data/traces/*.jsonl`);
    }
  }
  console.log("");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
