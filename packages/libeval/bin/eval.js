#!/usr/bin/env node
/* eslint-env node */
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import {
  Evaluator,
  EvaluationIndex,
  CriteriaEvaluator,
  RecallEvaluator,
  TraceEvaluator,
} from "@copilot-ld/libeval";
import { createStorage } from "@copilot-ld/libstorage";
import { clients, createTracer } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createLogger } from "@copilot-ld/libtelemetry";

// Extract generated clients
const { LlmClient, AgentClient, MemoryClient, TraceClient } = clients;

// Initialize logger
const logger = createLogger("eval");

/**
 * Load scenarios from config/eval.yml
 * @param {object} storage - Config storage instance
 * @param {string} scenario - Optional specific scenario ID to load
 * @returns {Promise<object[]>} Array of scenarios
 */
async function loadScenarios(storage, scenario = null) {
  const yamlString = await storage.get("eval.yml");
  if (!yamlString) {
    throw new Error("config/eval.yml not found");
  }

  const yamlObjects = yaml.load(yamlString);

  // Convert to array with IDs
  let scenarios = Object.entries(yamlObjects).map(([name, data]) => ({
    name,
    ...data,
  }));

  // Filter to specific scenario if requested
  if (scenario) {
    scenarios = scenarios.filter((s) => s.name === scenario);
    if (scenarios.length === 0) {
      throw new Error(`Scenario not found: ${scenario}`);
    }
  }

  return scenarios;
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
        default: "8",
      },
      scenario: {
        type: "string",
        short: "s",
      },
      iterations: {
        type: "string",
        short: "i",
        default: "5",
      },
      model: {
        type: "string",
        short: "m",
      },
    },
  });

  const args = {
    concurrency: parseInt(values.concurrency, 10),
    scenario: values.scenario || null,
    iterations: parseInt(values.iterations, 10),
    model: values.model || null,
  };

  // Initialize storage
  const configStorage = createStorage("config");
  const evalStorage = createStorage("eval");

  // Load config.json to get model matrix
  const config = await configStorage.get("config.json");
  if (!config) {
    throw new Error("config/config.json not found");
  }

  // Get models list - use CLI arg if provided, otherwise use config matrix
  const models = args.model ? [args.model] : config.evals?.models || [];
  if (models.length === 0) {
    throw new Error(
      "No models specified in config.json evals.models or via --model flag",
    );
  }

  // Initialize utility clients, without tracing
  const llmConfig = await createServiceConfig("llm");
  const memoryConfig = await createServiceConfig("memory");
  const traceConfig = await createServiceConfig("trace");

  const llmClient = new LlmClient(llmConfig);
  const memoryClient = new MemoryClient(memoryConfig);
  const traceClient = new TraceClient(traceConfig);

  // Initialize evaluation index for storing results
  const evaluationIndex = new EvaluationIndex(evalStorage);

  // The agent client is the one doing evaluations, so this gets tracing
  const tracer = await createTracer("agent");
  const agentConfig = await createServiceConfig("agent");
  const agentClient = new AgentClient(agentConfig, null, tracer);

  // Get GitHub token from environment
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    logger.error(
      "main",
      new Error("GITHUB_TOKEN environment variable is required"),
    );
    process.exit(1);
  }

  // Load scenarios
  const scenarios = await loadScenarios(configStorage, args.scenario);

  // Create evaluators
  const criteriaEvaluator = new CriteriaEvaluator(llmClient, githubToken);
  const recallEvaluator = new RecallEvaluator(agentConfig, memoryClient);
  const traceEvaluator = new TraceEvaluator(traceClient);

  // Plan all runs in a flat array - iterate over models, then iterations, then scenarios
  const runs = [];
  for (const model of models) {
    // Create evaluator with specific model
    const evaluator = new Evaluator(
      agentClient,
      memoryClient,
      traceClient,
      githubToken,
      model,
      evaluationIndex,
      criteriaEvaluator,
      recallEvaluator,
      traceEvaluator,
    );

    for (let iteration = 1; iteration <= args.iterations; iteration++) {
      for (const scenario of scenarios) {
        runs.push({
          name: scenario.name,
          scenario,
          iteration,
          model,
          evaluator,
        });
      }
    }
  }

  // Process runs in concurrent batches
  for (let i = 0; i < runs.length; i += args.concurrency) {
    const batch = runs.slice(i, i + args.concurrency);

    await Promise.all(
      batch.map(async ({ name, scenario, iteration, model, evaluator }) => {
        logger.debug("Evaluator", "Evaluating scenario", {
          name,
          iteration,
          model,
        });
        await evaluator.evaluate(scenario);
      }),
    );
  }

  // Flush remaining buffered results to storage
  await evaluationIndex.shutdown();
}

main().catch((error) => {
  logger.error("Evaluator", error);
  process.exit(1);
});
