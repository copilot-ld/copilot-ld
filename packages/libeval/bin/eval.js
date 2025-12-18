#!/usr/bin/env node
/* eslint-env node */
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import {
  Evaluator,
  EvaluationIndex,
  JudgeEvaluator,
  RecallEvaluator,
  TraceEvaluator,
} from "@copilot-ld/libeval";
import { createStorage } from "@copilot-ld/libstorage";
import { createResourceIndex } from "@copilot-ld/libresource";
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
 * Get models list from config or CLI args
 * @param {object} config - Config object
 * @param {string} modelArg - Model from CLI args
 * @returns {string[]} List of models
 */
function getModels(config, modelArg) {
  const models = modelArg ? [modelArg] : config.evals?.models || [];
  if (models.length === 0) {
    throw new Error(
      "No models specified in config.json evals.models or via --model flag",
    );
  }
  return models;
}

/**
 * Validate GitHub token from environment
 * @returns {string} GitHub token
 */
function getGithubToken() {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error("Error: GITHUB_TOKEN environment variable is required");
    process.exit(1);
  }
  return githubToken;
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

  // Get models and judge model from config
  const models = getModels(config, args.model);
  const judgeModel = config.evals?.judge_model || "gpt-4o";
  const githubToken = getGithubToken();

  // Initialize utility clients, without tracing
  const llmConfig = await createServiceConfig("llm");
  const memoryConfig = await createServiceConfig("memory");
  const traceConfig = await createServiceConfig("trace");

  const llmClient = new LlmClient(llmConfig);
  const memoryClient = new MemoryClient(memoryConfig);
  const traceClient = new TraceClient(traceConfig);

  // Initialize evaluation index for storing results
  const evaluationIndex = new EvaluationIndex(evalStorage);

  // Initialize resource index for storing conversation resources
  const resourceIndex = createResourceIndex("resources");

  // The agent client is the one doing evaluations, so this gets tracing
  const tracer = await createTracer("agent");
  const agentConfig = await createServiceConfig("agent");
  const agentClient = new AgentClient(agentConfig, null, tracer);

  // Load scenarios
  const scenarios = await loadScenarios(configStorage, args.scenario);

  // Create evaluators
  const judgeEvaluator = new JudgeEvaluator(
    llmClient,
    memoryClient,
    resourceIndex,
    githubToken,
    judgeModel,
  );
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
      judgeEvaluator,
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
  console.error("Error:", error.message || error);
  process.exit(1);
});
